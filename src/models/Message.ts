import mongoose, { Model } from 'mongoose';

export interface IMessageDocument extends mongoose.Document {
  senderName: String;
  receiverName: String;
  content: String;
  voice: String;
  status: String;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageModel extends Model<IMessageDocument> {
  searchPublicMessages(
    keyword: string,
    projection?: string
  ): IMessageDocument[];
  searchPrivateMessages(
    searcherName: string,
    keyword: string,
    projection?: string
  ): IMessageDocument[];
  searchAnnouncements(
    keyword: string,
    numOfResults: number,
    projection?: string
  ): IMessageDocument[];
}

const messageSchema = new mongoose.Schema(
  {
    senderName: String,
    receiverName: {
      type: String,
      default: 'public',
    },
    content: String,
    voice: String,
    status: String,
  },
  { timestamps: true }
);

messageSchema.index({
  content: 'text',
});

messageSchema.statics.searchPublicMessages = async function searchPublicMessages(
  keyword: string,
  projection: string = undefined
) {
  const conditions: any = {
    $text: { $search: keyword },
    receiverName: 'public',
  };
  try {
    return await Message.find(conditions, projection)
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
};

messageSchema.statics.searchPrivateMessages = async function searchPrivateMessages(
  searcherName: string,
  keyword: string,
  projection: string = undefined
) {
  const conditions: any = {
    $text: { $search: keyword },
    $or: [
      {
        senderName: searcherName,
        receiverName: { $nin: ['public', 'announcement'] },
      },
      { receiverName: searcherName },
    ],
  };
  try {
    return await Message.find(conditions, projection)
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
};

messageSchema.statics.searchAnnouncements = async function searchAnnouncements(
  keyword: string,
  numOfResults: number,
  projection: string = undefined
) {
  const conditions: any = {
    $text: { $search: keyword },
    receiverName: 'announcement',
  };
  try {
    return await Message.find(conditions, projection)
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
};

export const Message: IMessageModel = mongoose.model<
  IMessageDocument,
  IMessageModel
>('Message', messageSchema);