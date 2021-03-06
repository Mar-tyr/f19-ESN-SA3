import bcrypt from 'bcrypt-nodejs';
import mongoose, { Model } from 'mongoose';

export interface IUserDocument extends mongoose.Document {
  username: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  isOnline: boolean;
  status: string;
  role: string;
  active: boolean;

  profile: {
    name?: string;
    phone?: String;
    gender?: string;
    location?: string;
    toObject?: () => any;
  };

  comparePassword: (candidatePassword: string) => Promise<boolean>;
  setIsOnline: (isLogin: boolean) => Promise<any>;
  setStatus: (status: string) => Promise<any>;
}

export interface IUserModel extends Model<IUserDocument> {
  findUserById(id: string): IUserDocument;
  findUserByName(username: string): IUserDocument;
  createNewUser(doc: any): IUserDocument;
  getAllUsers(projection?: string): IUserDocument[];
  searchUsersByName(keyword: string, projection?: string): IUserDocument[];
  searchUsersByStatus(keyword: string, projection?: string): IUserDocument[];
  updateUserInfo(
    oldUserName: string,
    newUserName: string,
    password: string,
    active: boolean,
    role: string
  ): void;
}

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    passwordResetToken: String,
    passwordResetExpires: Date,

    isOnline: { type: Boolean, default: false },
    status: String,
    role: { type: String, default: 'citizen' },
    active: { type: Boolean, default: true },

    profile: {
      name: String,
      phone: String,
      gender: String,
      location: String,
    },
  },
  { timestamps: true }
);

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this as IUserDocument;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword: string) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(
      candidatePassword,
      this.password,
      (err: mongoose.Error, isMatch: boolean) => {
        if (err) {
          reject(err);
        } else {
          resolve(isMatch);
        }
      }
    );
  });
};

userSchema.statics.findUserById = async function findUserById(id: string) {
  try {
    return await User.findOne({ _id: id });
  } catch (err) {
    throw err;
  }
};

userSchema.statics.findUserByName = async function findUserByName(
  username: string
) {
  try {
    return await User.findOne({ username }).exec();
  } catch (err) {
    throw err;
  }
};

userSchema.statics.createNewUser = async function createNewUser(doc: any) {
  const user = new User(doc);
  try {
    return await user.save();
  } catch (err) {
    throw err;
  }
};

userSchema.statics.getAllUsers = async function getAllUsers(
  projection: string = undefined
) {
  try {
    return await User.find({}, projection).exec();
  } catch (err) {
    throw err;
  }
};

userSchema.statics.searchUsersByName = async function searchUsersByName(
  keyword: string,
  projection: string = undefined
) {
  try {
    return await User.find(
      { username: { $regex: keyword, $options: 'i' } },
      projection
    )
      .sort({ isOnline: -1, username: 1 })
      .exec();
  } catch (err) {
    throw err;
  }
};

userSchema.statics.searchUsersByStatus = async function searchUsersByStatus(
  keyword: string,
  projection: string = undefined
) {
  try {
    return await User.find({ status: keyword }, projection)
      .sort({ isOnline: -1, username: 1 })
      .exec();
  } catch (err) {
    throw err;
  }
};

userSchema.methods.setIsOnline = async function setIsOnline(isOnline: boolean) {
  const user = this as IUserDocument;
  try {
    user.isOnline = isOnline;
    return await user.updateOne({ isOnline }).exec();
  } catch (err) {
    throw err;
  }
};

userSchema.methods.setStatus = async function setStatus(status: string) {
  const user = this as IUserDocument;
  try {
    user.status = status;
    return await user.updateOne({ status }).exec();
  } catch (err) {
    throw err;
  }
};

userSchema.statics.updateUserInfo = async function updateUserInfo(
  oldUserName: string,
  newUserName: string,
  password: string,
  active: boolean,
  role: string
) {
  try {
    const filter = { username: oldUserName };
    const update = {
      username: newUserName,
      active: active,
      role: role,
      //TODO: Need to update password
    };
    await User.findOneAndUpdate(filter, update);
  } catch (err) {
    throw err;
  }
};

export const User: IUserModel = mongoose.model<IUserDocument, IUserModel>(
  'User',
  userSchema
);
