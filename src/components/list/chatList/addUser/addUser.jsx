import React, { useState } from "react";
import "./addUser.css";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        setUser({ id: querySnapShot.docs[0].id, ...querySnapShot.docs[0].data() });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error searching user:", err);
    }
  };

  const handleAdd = async () => {
    if (!user || !currentUser) return;

    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");
    const newChatRef = doc(chatRef);

    try {
      // Create a new chat document
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Ensure the user chat document exists before updating
      await setDoc(doc(userChatsRef, user.id), { chats: [] }, { merge: true });
      await setDoc(doc(userChatsRef, currentUser.id), { chats: [] }, { merge: true });

      // Update chat references in userchats collection
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      console.log("Chat added:", newChatRef.id);
    } catch (err) {
      console.error("Error adding chat:", err);
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
