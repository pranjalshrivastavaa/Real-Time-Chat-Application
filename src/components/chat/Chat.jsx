import React, { useEffect, useState, useRef } from 'react';
import "./chat.css";
import EmojiPicker from 'emoji-picker-react';
import { arrayUnion, doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';  
import { db, storage } from '../../lib/firebase';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const Chat = () => {
    const [chat, setChat] = useState(null);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [img, setImg] = useState({ file: null, url: "" });
    const [loading, setLoading] = useState(false);

    const { currentUser } = useUserStore();
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

    const endRef = useRef(null);

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chat?.messages]);

    useEffect(() => {
        if (!chatId) return;
        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data());
        });

        return () => unSub();
    }, [chatId]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImg = (e) => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const uploadImage = async (file) => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `chatImages/${chatId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                null,
                (error) => {
                    console.error("Upload Error:", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    };

    const handleSend = async () => {
        if (text.trim() === "" && !img.file) return;

        setLoading(true);

        try {
            let imgUrl = null;
            if (img.file) {
                imgUrl = await uploadImage(img.file);
            }

            const newMessage = {
                senderId: currentUser.id,
                text,
                createdAt: new Date().toISOString(),
                ...(imgUrl && { img: imgUrl }),
            };

            const chatRef = doc(db, "chats", chatId);

            // ✅ Fetch latest chat data (Prevents overwriting previous messages)
            const chatSnapshot = await getDoc(chatRef);
            const chatData = chatSnapshot.exists() ? chatSnapshot.data() : { messages: [] };

            const updatedMessages = [...(chatData.messages || []), newMessage];

            // ✅ Update Firestore with the latest messages
            await updateDoc(chatRef, {
                messages: updatedMessages,
            });

            // ✅ Instantly update UI (Avoids waiting for Firestore)
            setChat((prevChat) => ({
                ...prevChat,
                messages: updatedMessages,
            }));

            // ✅ Update Last Message for Users
            const userIDs = [currentUser.id, user.id];

            for (const id of userIDs) {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatsRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

                    if (chatIndex !== -1) {
                        userChatsData.chats[chatIndex] = {
                            ...userChatsData.chats[chatIndex],
                            lastMessage: text || "[Image]",
                            isSeen: id === currentUser.id,
                            updatedAt: Date.now(),
                        };

                        await updateDoc(userChatsRef, { chats: userChatsData.chats });
                    }
                }
            }

            setText("");
            setImg({ file: null, url: "" });

        } catch (err) {
            console.log("Error sending message:", err);
        }

        setLoading(false);
    };

    return (
        <div className='chat'>
            <div className="top">
                <div className="user">
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p>Active now</p>
                    </div>
                </div>
                <div className="icons">
                    <img src="./phone.png" alt="" />
                    <img src="./video.png" alt="" />
                    <img src="./info.png" alt="" />
                </div>
            </div>
            <div className="center">
                {chat?.messages?.map((message, index) => (
                    <div className={`message ${message.senderId === currentUser.id ? "own" : ""}`} key={index}>
                        {message.img && <img src={message.img} alt="sent-img" />}
                        <div className="texts">
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
                {img.url && <div className='message own'>
                    <div className="texts">
                        <img src={img.url} alt="preview-img" />
                    </div>
                </div>}
                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="./img.png" alt="" />
                    </label>
                    <input type="file" id='file' style={{ display: "none" }} onChange={handleImg} />
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />
                </div>
                <input 
                    type="text" 
                    placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You cannot send a message" : 'Type a message...'} 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen(prev => !prev)} />
                    {open && <EmojiPicker onEmojiClick={handleEmoji} />}
                </div>
                <button className='sendButton' onClick={handleSend} disabled={loading || isCurrentUserBlocked || isReceiverBlocked}>
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default Chat;
