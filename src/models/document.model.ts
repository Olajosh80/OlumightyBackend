import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

interface IDocument extends MongoDocument {
    title: string;
    content: string;
    timestamp: Date;
}

const DocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);
