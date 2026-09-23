const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Pricelist = require("../models/Pricelist");
const User = require("../models/User");

function daysFor(unit, start, end) {
  const ms=Math.max(86400000,new Date(end)-new Date(start));
  const days=Math.max(1,Math.ceil(ms/86400000));
  if(unit==="hour") return Math.max(1,Math.ceil(ms/3600000));
  if(unit==="week") return Math.max(1,Math.ceil(days/7));
  if(unit==="month") return Math.max(1,Math.ceil(days/30));
  if(unit==="year") return Math.max(1,Math.ceil(days/365));
  return days;
}
function normalizeStatus(status) {
 if (status === "confirmed") return "reserved";
 if (status === "out-for-delivery" || status === "delivered" || status === "return-pending") return "picked_up";
 if (status === "returned") return "completed";
 return status;
}
function mapOrder(o){
 return {
  id:o._id, customerId:o.customer?._id||o.customer, status:normalizeStatus(o.status), createdAt:o.createdAt?.toISOString?.().slice(0,10)||o.createdAt,
  lines:(o.items||[]).map(i=>({productId:i.product?._id||i.product,productName:i.productName||i.product?.name||"",qty:i.quantity,unit:i.unit||"day",startDate:new Date(i.startDate).toISOString().slice(0,10),endDate:new Date(i.endDate).toISOString().slice(0,10),unitPrice:i.unitPrice??i.dailyRate??0,lineTotal:i.lineTotal??i.subtotal??0})),
  pricelistId:o.pricelist?._id||o.pricelist||null,subtotal:o.subtotal,total:o.totalRentalCost,discount:o.discount,
  paymentType:o.paymentType,depositAmount:o.totalDeposit,paidAmount:o.paidAmount,paymentStatus:o.paymentStatus,
  reservedAt:o.reservedAt?.toISOString?.().slice(0,10)||null,pickupScheduled:o.pickupScheduled?.toISOString?.().slice(0,10)||null,pickedUpAt:o.pickedUpAt?.toISOString?.().slice(0,10)||null,
  returnScheduled:o.returnScheduled?.toISOString?.().slice(0,10)||null,returnedAt:o.returnedAt?.toISOString?.().slice(0,10)||null,
  lateFee:o.lateFee,contractGenerated:o.contractGenerated,
  condition:o.condition||{pickupScore:null,pickupNote:"",returnScore:null,returnNote:"",deduction:0},
  orderNumber:o.orderNumber
 };
}

router.get("/my-orders",auth,async(req,res)=>{try{const orders=await Order.find({customer:req.user.id}).populate("items.product").populate("pricelist").sort({createdAt:-1});res.json(orders.map(mapOrder));}catch(e){res.status(500).json({error:e.message});}});
router.get("/",auth,async(req,res)=>{try{const orders=await Order.find().populate("customer","name email").populate("items.product").populate("pricelist").sort({createdAt:-1});res.json(orders.map(mapOrder));}catch(e){res.status(500).json({error:e.message});}});

router.post("/",auth,async(req,res)=>{
 try{
  const b=req.body; if(!b.items?.length)return res.status(400).json({message:"Order must contain at least one item."});
  const products=await Promise.all(b.items.map(i=>Product.findById(i.productId)));
  if(products.some(p=>!p))return res.status(400).json({message:"One or more products do not exist."});
  let subtotal=0;
  const items=b.items.map((i,idx)=>{
    const p=products[idx]; const price=Number(i.unitPrice ?? p.price?.[i.unit] ?? p.dailyRate ?? 0); const total=Number(i.lineTotal ?? price*i.qty);
    subtotal+=total;
    return {product:p._id,productName:p.name,unit:i.unit,unitPrice:price,dailyRate:p.dailyRate,quantity:i.qty,startDate:new Date(i.startDate),endDate:new Date(i.endDate),durationDays:daysFor(i.unit,i.startDate,i.endDate),subtotal:total,lineTotal:total};
  });
  let discount=0, pl=null;
  const candidate=await Pricelist.find({active:true}).sort({priority:-1});
  const user=await User.findById(req.user.id);
  const today=new Date().toISOString().slice(0,10);
  pl=candidate.find(x=>(!x.segment || x.segment===user?.segment) && (!x.validFrom||today>=x.validFrom)&&(!x.validTo||today<=x.validTo));
  // If the customer has no stored segment, use the first active unrestricted list.
  if(!pl) pl=candidate.find(x=>!x.segment && (!x.validFrom||today>=x.validFrom)&&(!x.validTo||today<=x.validTo))||null;
  if(pl) discount=pl.discountType==="percent"?subtotal*pl.discountValue/100:Math.min(pl.discountValue,subtotal);
  const total=Math.max(0,subtotal-discount); const deposit=b.paymentType==="partial"?Math.round(total*.3*100)/100:0;
  const order=await Order.create({customer:req.user.id,items,subtotal,discount,totalRentalCost:total,totalDeposit:deposit,pricelist:pl?._id||null,status:"quotation",paymentType:b.paymentType||"full",pickupScheduled:new Date(items[0].startDate),returnScheduled:new Date(items[0].endDate),condition:{pickupScore:null,pickupNote:"",returnScore:null,returnNote:"",deduction:0}});
  res.status(201).json(mapOrder(order));
 }catch(e){res.status(400).json({error:e.message});}
});

router.post("/:id/pay",auth,async(req,res)=>{
 try{const o=await Order.findOne({_id:req.params.id,customer:req.user.id});if(!o)return res.status(404).json({message:"Order not found"});
  const amount=o.paymentType==="partial"?o.totalDeposit:o.totalRentalCost; o.paidAmount=amount;o.paymentStatus=o.paymentType==="partial"?"deposit_paid":"paid";o.status="reserved";o.reservedAt=new Date();o.contractGenerated=true;o.paymentReference="PAY-"+Date.now().toString(36).toUpperCase(); for(const item of o.items){await Product.findByIdAndUpdate(item.product, {$inc:{availableStock:-item.quantity}});} await o.save();res.json(mapOrder(o));
 }catch(e){res.status(400).json({error:e.message});}
});

router.post("/:id/balance",auth,async(req,res)=>{try{const o=await Order.findOne({_id:req.params.id,customer:req.user.id});if(!o)return res.status(404).json({message:"Order not found"});o.paidAmount=o.totalRentalCost;o.paymentStatus="paid";o.paymentReference="BAL-"+Date.now().toString(36).toUpperCase();await o.save();res.json(mapOrder(o));}catch(e){res.status(400).json({error:e.message});}});
router.patch("/:id/cancel",auth,async(req,res)=>{const o=await Order.findOne({_id:req.params.id,customer:req.user.id,status:{$nin:["completed","cancelled"]}});if(!o)return res.status(404).json({message:"Order not found"});if(["reserved","picked_up"].includes(o.status)){for(const item of o.items){await Product.findByIdAndUpdate(item.product,{$inc:{availableStock:item.quantity}});}}o.status="cancelled";await o.save();res.json(mapOrder(o));});

module.exports=router;
