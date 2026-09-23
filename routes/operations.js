const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Product = require("../models/Product");

const populate = q => q.populate("customer","name email").populate("items.product");

router.get("/deliveries", auth, async (req,res)=>{try{res.json(await populate(Order.find({status:{$in:["quotation","reserved","picked_up"]}}).sort({createdAt:-1})));}catch(e){res.status(500).json({error:e.message});}});
router.patch("/deliveries/:id", auth, async(req,res)=>{try{
 const o=await Order.findById(req.params.id); if(!o)return res.status(404).json({message:"Order not found"});
 const next=req.body.status;
 if(next==="reserved" && o.status==="quotation"){
   for(const item of o.items){ await Product.findByIdAndUpdate(item.product, {$inc:{availableStock:-item.quantity}}); }
   o.reservedAt=new Date(); o.contractGenerated=true;
 }
 o.status=next; await o.save(); res.json(o);
}catch(e){res.status(400).json({error:e.message});}});

router.post("/orders/:id/pickup", auth, async(req,res)=>{try{
 const o=await Order.findById(req.params.id); if(!o)return res.status(404).json({message:"Order not found"});
 o.status="picked_up"; o.pickedUpAt=new Date(); o.condition.pickupScore=Number(req.body.score); o.condition.pickupNote=req.body.note||"";
 await o.save(); res.json(o);
}catch(e){res.status(400).json({error:e.message});}});

router.post("/orders/:id/return", auth, async(req,res)=>{try{
 const o=await Order.findById(req.params.id); if(!o)return res.status(404).json({message:"Order not found"});
 const score=Number(req.body.score); o.condition.returnScore=score; o.condition.returnNote=req.body.note||"";
 const drop=Math.max(0,(o.condition.pickupScore||score)-score); const base=o.totalDeposit||o.totalRentalCost*0.2;
 o.condition.deduction=Math.round(base*(drop/100)*100)/100;
 const days=Math.max(0,Math.ceil((new Date()-new Date(o.returnScheduled))/86400000));
 o.lateFee=Math.round(days*(o.items[0]?.unitPrice||0)*0.1*10)/10;
 for(const item of o.items){ await Product.findByIdAndUpdate(item.product, {$inc:{availableStock:item.quantity}}); }
 o.status="completed"; o.returnedAt=new Date(); o.returnDetails.actualReturnDate=new Date(); o.returnDetails.lateFeesApplied=o.lateFee;
 await o.save(); res.json(o);
}catch(e){res.status(400).json({error:e.message});}});

router.get("/returns", auth, async(req,res)=>{try{res.json(await populate(Order.find({status:{$in:["picked_up","return-pending"]}}).sort({returnScheduled:1})));}catch(e){res.status(500).json({error:e.message});}});
router.post("/returns/:id/process", auth, async(req,res)=>{try{
 const o=await Order.findById(req.params.id); if(!o)return res.status(404).json({message:"Order not found"});
 for(const item of o.items){ await Product.findByIdAndUpdate(item.product, {$inc:{availableStock:item.quantity}}); }
 o.status="completed"; o.returnedAt=new Date(); await o.save(); res.json({message:"Item returned successfully",order:o});
}catch(e){res.status(400).json({error:e.message});}});
module.exports=router;
