const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, { userId, bookInput }, context) => {
      // If context has a `user` property, that means the user executing this mutation has a valid JWT and is logged in
      if (context.user) {
        const result = await User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: { savedBooks: bookInput },
          },
          {
            new: true,
            // runValidators: true,
          }
        );
        return result;
      }
      // If user attempts to execute this mutation and isn't logged in, throw an error
      throw AuthenticationError;
    },

    // Make it so a logged in user can only remove a skill from their own profile
    removeBook: async (parent, { bookId }, context) => {
      if (context.user._id) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );

        return updatedUser;
      }
      throw AuthenticationError;
    },
  },
};

module.exports = resolvers;
