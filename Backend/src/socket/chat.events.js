import Conversation from '../models/ConversationModel.js'
import Message from '../models/MessageModel.js'

export const registerChatevents = (io, socket) => {


    socket.on("getConversations", async () => {
        try {
            const userId = socket.data.userId
            if (!userId) {
                socket.emit("getConversations", {
                    success: false,
                    msg: "Unauthorized"
                })
                return
            }
            //find all convo where this user is a participants
            const conversations = await Conversation.find({
                participants: userId
            })
                .sort({ updatedAt: -1 })
                .populate({
                    path: 'lastMessage',
                    select: 'senderId content attachment createdAt'
                })
                .populate({
                    path: "participants",
                    select: "name email avatar",
                }).lean()

            //console.log("fetched convos",conversations)
            socket.emit("getConversations", {
                success: true,
                data: conversations
            })

        } catch (error) {
            console.log("Get Conversation Error", error)
            socket.emit("getConversations", {
                success: false,
                msg: "Failed to Fetch conversations"
            })
        }
    })



    socket.on("newConversation", async (data) => {

        try {

                const existingConversation = await Conversation.findOne({
                    participants: { $all: data.participants, $size: 2 }
                }).populate({
                    path: "participants",
                    select: "name email avatar"
                }).lean()

                if (existingConversation) {
                    socket.emit("newConversation", {
                        success: true,
                        data: { ...existingConversation, isNew: false }
                    })
                    return
                }
            

            const conversation = await Conversation.create({
                type: data.type,
                name: data.name || "",// con be empty is direct coovo
                participants: data.participants,
                avatar: data.avatar || "",  // can be empty if direct convo
                createdBy: socket.data.userId
            })
          

            const connectedSockets = Array.from(io.sockets.sockets.values())
                .filter((s) => data.participants.includes(s.data.userId))

            // join this convo by all online participants

            connectedSockets.forEach((participantSocket) => {
                participantSocket.join(conversation._id.toString())
            })

            // send populated convesation back
            const populatedConversation = await Conversation.findById(conversation._id).populate({
                path: "participants",
                select: "name email avatar"
            }).lean()

            if (!populatedConversation) {
                throw new Error("Failed to Populate this Conversation");

            }
            
            // emit coversation to all participants
            io.to(conversation._id.toString()).emit("newConversation", {
                success: true,
                data: { ...populatedConversation, isNew: true }
            })
        } catch (error) {
            console.log("New Conversation Error", error)
            socket.emit("newConversation", {
                success: false,
                msg: "Failed to create conversation"
            })
        }

    })

    socket.on("newMessage", async (data) => {
        try {
            const message = await Message.create({
                conversationId: data.conversationId,
                senderId: data.sender.id,
                content: data.content,
                attachment: data.attachment,
            })
          
            
            io.to(data.conversationId).emit("newMessage", {
                success: true,
                data: {
                    id: message._id,
                    conversationId: data.conversationId,

                    sender: {
                        id: data.sender.id,
                        name: data.sender.name,
                        avatar: data.sender.avatar,
                    },
                    content: data.content,
                    attachment: data.attachment,
                    createdAt: new Date().toISOString()
                }
            })
            //update conversation lastMessage property
            await Conversation.findByIdAndUpdate(data.conversationId, {
                lastMessage: message._id
            })

              console.log("this is created message ", message)
        } catch (error) {
            console.log("New Message Error", error)
            socket.emit("newMessage", {
                success: false,
                msg: "Failed to send a Message"
            })
        }

    })


    socket.on("getMessages", async (data) => {
        //console.log("this is message convo id", data)
 //console.log("This is new Conversation ID", data.conversationId)

        try {

            const messages = await Message.find({
                conversationId:data.conversationId
            })
                .sort({ createdAt: -1 })
                .populate({
                    path: "senderId",
                    select: "name avatar",
                }).lean()

            const messageWithSender = messages.map((message) => ({
                ...message,
                id: message._id,
                sender: {
                    id: message.senderId._id,
                    name: message.senderId.name,
                    avatar: message.senderId.avatar,
                }
            }))

            socket.emit("getMessages", {
                success: true,
                data: messageWithSender,
            })

            console.log(" FETCHED Messages", messageWithSender)
        } catch (error) {
            console.log(" Error geting Messages", error)
            socket.emit("getMessages", {
                success: false,
                msg: "Failed to get Messages"
            })
        }
    })


     socket.on("userIsTyping", (data)=>{
       console.log(' is typing...')

       io.to(data.conversationId).emit("userIsTyping", {
        success:true,
       })
     })


    //  socket.on("userStoppedTyping", (data)=>{
    //    console.log(" sttopped typing...")

    //    socket.broadcast.emit("userStoppedTyping", {
    //     success:true,
    //    })
    //  })
} 