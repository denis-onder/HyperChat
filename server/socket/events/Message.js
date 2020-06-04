/**
 * Module to handle the socket message event.
 * @module Socket Message Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

// At the start, import the needed modules
import marked from 'marked';
import sanitizeHtml from 'sanitize-html';
import Filter from 'bad-words';

// Set the message command prefix
const prefix = '/';

// Define new bad-words Filter
const filter = new Filter();

// Define a new array of objects of special users
let specialUsers = [];

// Put the special users with details in the special user array
specialUsers.push(
  {
    Username: 'Justsnoopy30',
    Type: 'Owner',
    UsernameColor: '#00b0f4',
    BadgeColor: '#7289da',
  },
  {
    Username: 'kmisterk',
    Type: 'Helper',
    UsernameColor: '#00b0f4',
    BadgeColor: '#691785',
  }
);

function handleMessage({ io, socket, message }) {
  // Stop right there if the user tries to send a null or non-string message
  if (typeof message !== 'string' || message == null) return;
  // If the muted list includes the user trying to send the message, stop right there
  if (mutedList.includes(socket.username)) return;
  // Check if the message is over 2000 character, and if it is, change it to a
  // ...predetermined message indicating that the message is too long and return
  if (message.length > 2000) {
    io.in(socket.server).emit('new message', {
      username: socket.username,
      message:
        'This message was removed because it was too long (over 2000 characters).',
      type: 'normal',
    });
    return;
  }
  // Clean the message with a bad word filter
  const filteredMessage = filter.clean(message);

  // Convert markdown to html with the Marked markdown library
  const messageHtml = marked(filteredMessage);

  // Sanitize the message html with the sanitize-html library
  const finalMessage = sanitizeHtml(messageHtml);

  // Perform special user checking and then send the final message to everyone in the user's server
  const specialUser = specialUsers.find(
    (specialUser) => specialUser.Username === socket.username
  );
  if (specialUser) {
    messageModel.create(
      {
        user: socket.username,
        message: finalMessage,
        special: true,
        type: specialUser.Type,
        usernameColor: specialUser.UsernameColor,
        badgeColor: specialUser.BadgeColor,
      },
      (err, msg) => {
        if (err) return;
        io.in(socket.server).emit('new message', {
          username: msg.user,
          message: msg.message,
          special: msg.special,
          type: msg.type,
          usernameColor: msg.usernameColor,
          badgeColor: msg.badgeColor,
        });
      }
    );
  } else {
    messageModel.create(
      {
        user: socket.username,
        message: finalMessage,
        type: 'normal',
      },
      (err, msg) => {
        if (err) return;
        io.in(socket.server).emit('new message', {
          username: msg.user,
          message: msg.message,
          type: msg.type,
        });
      }
    );
  }

  // Define commandWithArgumentArray as an empty array to start
  let commandWithArgumentArray = [];
  // Remove the command prefix and get the command and argument as an array with magic split code
  // See https://stackoverflow.com/a/10272828/8584806
  if (message[0] == prefix) {
    // Starts with the command prefix, so remove the prefix and set the commandWithArgumentArray
    // to an array with the command as the first entry, and the argument as the second entry
    commandWithArgumentArray = message.substr(1).split(/(?<=^\S+)\s/);
  } else {
    // The message doesn't start with the command prefix, indicating it can't be a command, so return
    return;
  }
  // Get the command
  const command = commandWithArgumentArray[0];
  // Get the argument
  const commandArgument = commandWithArgumentArray[1];
  // Function to send a server message indicating that the user to execute the command on
  // is not in the room, and return
  function commandNonexistingUserSpecified() {
    io.in(socket.server).emit('new message', {
      username: 'HyperChat',
      message: 'The user specified in the command is not in the room.',
      special: true,
      type: 'Server',
    });
    return;
  }

  // Function to send a server message indicating that the user does not have access
  // to the command, and return
  function commandAccessDenied() {
    io.in(socket.server).emit('new message', {
      username: 'HyperChat',
      message: 'Access Denied.',
      special: true,
      type: 'Server',
    });
    return;
  }

  // Function to send a server message indicating that the user specified an
  // invalid command, and return
  function invalidCommand() {
    io.in(socket.server).emit('new message', {
      username: 'HyperChat',
      message: 'Invalid command.',
      special: true,
      type: 'Server',
    });
    return;
  }

  // Special admin commands
  switch (command) {
    case 'mute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToMute = commandArgument;
      mutedList.push(userToMute);
      io.to(userMap.get(userToMute)).emit('mute');
      break;
    }
    case 'unmute': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnmute = commandArgument;
      mutedList = arrayRemove(mutedList, userToUnmute);
      io.to(userMap.get(userToUnmute)).emit('unmute');
      break;
    }
    case 'flip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToFlip = commandArgument;
      io.to(userMap.get(userToFlip)).emit('flip');
      break;
    }
    case 'unflip': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToUnflip = commandArgument;
      io.to(userMap.get(userToUnflip)).emit('unflip');
      break;
    }
    case 'stupidify': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToStupidify = commandArgument;
      io.to(userMap.get(userToStupidify)).emit('stupidify');
      break;
    }
    case 'smash': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToSmash = commandArgument;
      io.to(userMap.get(userToSmash)).emit('smash');
      break;
    }
    case 'kick': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToKick = commandArgument;
      io.to(userMap.get(userToKick)).emit('kick');
      io.sockets.sockets[userMap.get(userToKick)].disconnect();
      break;
    }
    case 'stun': {
      // If the user isn't an admin (currently hardcoded :D), return with commandAccessDenied()
      if (socket.username !== 'Justsnoopy30') {
        return commandAccessDenied();
      }
      // If the user to execute the command in isn't in the room, return with commandNonexistingUserSpecified()
      if (!userListContents[socket.server].includes(commandArgument)) {
        return commandNonexistingUserSpecified();
      }
      const userToStun = commandArgument;
      io.to(userMap.get(userToStun)).emit('stun');
      break;
    }
    default: {
      invalidCommand();
      break;
    }
  }
}

// Export the handleMessage function as the default export
export default handleMessage;
