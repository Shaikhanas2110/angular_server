const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const User = require("../models/User");

router.get("/mine", auth, async (req,res)=>{
  try { const list=await Notification.find({recipient:req.user.id}).sort({createdAt:-1}); res.json(list.map(n=>({id:n._id,orderId:n.relatedOrder,title:n.title,message:n.message,type:n.type,isRead:n.isRead,sentAt:n.createdAt}))); }
  catch(e){res.status(500).json({error:e.message});}
});

router.post("/scan", auth, async(req,res)=>{
  try {
    const lead=Number(req.body.leadDays ?? 2); const now=new Date(); const end=new Date(now); end.setDate(end.getDate()+lead);
    const orders=await Order.find({status:"picked_up",returnScheduled:{$gte:now,$lte:end}}).populate("customer","email name");
    let created=0;
    for(const o of orders){
      const exists=await Notification.exists({recipient:o.customer._id,relatedOrder:o._id,type:"return_reminder"});
      if(exists) continue;
      await Notification.create({recipient:o.customer._id,title:"Return reminder",message:`Your rental (${o.orderNumber}) is due for return on ${new Date(o.returnScheduled).toLocaleDateString("en-IN")}.`,type:"return_reminder",relatedOrder:o._id});
      created++;
    }
    res.json({created});
  } catch(e){res.status(500).json({error:e.message});}
});

router.patch("/:id/read", auth, async(req,res)=>{
  const n=await Notification.findOneAndUpdate({_id:req.params.id,recipient:req.user.id},{isRead:true},{new:true});
  if(!n)return res.status(404).json({message:"Notification not found"}); res.json(n);
});
module.exports=router;
