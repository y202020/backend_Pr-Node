import mongoose, { Schema } from "mongoose";
import { User } from "./user.model.js";
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who subscribing
        ref:"User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whome is subscribing
        ref:"User"
    }
}, {timestamps:true})


export const Subscription = mongoose.model("Subscription",subscriptionSchema)