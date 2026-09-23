const express = require("express");
const router = express.Router();
const Pricelist = require("../models/Pricelist");
const auth = require("../middleware/auth");

function normalize(p) {
  return {
    id: p._id, name: p.name,
    segment: p.segment ?? ({ standard: "Standard", corporate: "Corporate" }[p.targetAudience] || null),
    scope: p.scope || "all", discountType: p.discountType || "percent",
    discountValue: p.discountValue ?? 0, validFrom: p.validFrom || "", validTo: p.validTo || "",
    active: p.active ?? p.isActive ?? true, priority: p.priority ?? 1,
  };
}
router.get("/", auth, async (req,res)=>{ try { res.json((await Pricelist.find().sort({priority:-1,name:1})).map(normalize)); } catch(e){res.status(500).json({error:e.message});}});
router.post("/", auth, async (req,res)=>{ try {
  const b=req.body; const p=await Pricelist.create({name:b.name,code:b.code||("PL-"+Date.now()),segment:b.segment||null,scope:b.scope||"all",discountType:b.discountType||"percent",discountValue:b.discountValue||0,validFrom:b.validFrom||"",validTo:b.validTo||"",active:b.active!==false,priority:b.priority||1,isActive:b.active!==false});
  res.status(201).json(normalize(p));
} catch(e){res.status(400).json({error:e.message});}});
router.patch("/:id", auth, async(req,res)=>{try{
  const b={...req.body}; delete b.id; if(b.active!==undefined)b.isActive=b.active;
  const p=await Pricelist.findByIdAndUpdate(req.params.id,b,{new:true,runValidators:true}); if(!p)return res.status(404).json({message:"Pricelist not found"}); res.json(normalize(p));
}catch(e){res.status(400).json({error:e.message});}});
module.exports=router;
