const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Order = require("../models/Order");

router.get("/analytics", auth, async (req,res)=>{
  try {
    const validMatch={status:{$nin:["cancelled","quotation"]}};
    const [revenueAgg,statusAgg,productAgg,customerAgg,trendAgg,categoryAgg] = await Promise.all([
      Order.aggregate([{ $match: validMatch },{$group:{_id:null,revenue:{$sum:"$paidAmount"},totalBookings:{$sum:1}}}]),
      Order.aggregate([{$group:{_id:"$status",count:{$sum:1}}}]),
      Order.aggregate([{$unwind:"$items"},{$group:{_id:"$items.product",qty:{$sum:"$items.quantity"},revenue:{$sum:"$items.lineTotal"}}},{$sort:{qty:-1}},{$limit:10},{$lookup:{from:"products",localField:"_id",foreignField:"_id",as:"product"}},{$unwind:{path:"$product",preserveNullAndEmptyArrays:true}}]),
      Order.aggregate([{$match:validMatch},{$group:{_id:"$customer",revenue:{$sum:"$paidAmount"},orders:{$sum:1}}},{$sort:{revenue:-1}},{$limit:10},{$lookup:{from:"users",localField:"_id",foreignField:"_id",as:"customer"}},{$unwind:{path:"$customer",preserveNullAndEmptyArrays:true}}]),
      Order.aggregate([{$match:validMatch},{$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}},count:{$sum:1}}},{$sort:{_id:1}},{$limit:30}]),
      Order.aggregate([{$match:validMatch},{$unwind:"$items"},{$lookup:{from:"products",localField:"items.product",foreignField:"_id",as:"product"}},{$unwind:{path:"$product",preserveNullAndEmptyArrays:true}},{$group:{_id:"$product.category",revenue:{$sum:"$items.lineTotal"}}}])
    ]);
    res.json({
      revenue: revenueAgg[0]?.revenue || 0, totalBookings: revenueAgg[0]?.totalBookings || 0,
      breakdown: statusAgg,
      mostRentedProducts: productAgg.map(x=>({name:x.product?.name||"Unknown",qty:x.qty,revenue:x.revenue})),
      topCustomers: customerAgg.map(x=>({name:x.customer?.name||"Unknown",revenue:x.revenue,orders:x.orders})),
      bookingTrend: trendAgg,
      revenueByCategory: categoryAgg.map(x=>({category:x._id||"Unknown",revenue:x.revenue}))
    });
  } catch(e){res.status(500).json({error:e.message});}
});
module.exports=router;
