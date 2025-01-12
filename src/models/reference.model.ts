import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

interface IReferenceData extends MongoDocument {
    title: string;
    content: string;
    timestamp: Date;
}

const ReferenceSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IReferenceData>('ReferenceData', ReferenceSchema);
