import { Schema } from 'mongoose'

// Content collections are loosely typed on purpose, so you can add fields to works, videos, etc.
// from the admin without changing the backend. Tighten these schemas later if you want strict data.
const toJSON = {
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id)
    delete ret._id
    return ret
  },
}
const loose = () => new Schema({}, { strict: false, timestamps: true, toJSON })

export const SCHEMAS = [
  { name: 'Work', schema: loose() },
  { name: 'Track', schema: loose() },
  { name: 'Video', schema: loose() },
  { name: 'Post', schema: loose() },
  { name: 'Setting', schema: loose() },
  { name: 'Message', schema: loose() },
  { name: 'Order', schema: new Schema({ ref: { type: String, unique: true, index: true } }, { strict: false, timestamps: true, toJSON }) },
  { name: 'User', schema: new Schema({ email: { type: String, unique: true, lowercase: true }, passwordHash: String }, { timestamps: true, toJSON }) },
]
