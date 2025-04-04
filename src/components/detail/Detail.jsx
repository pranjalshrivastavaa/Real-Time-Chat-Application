import React from 'react';
import "./detail.css";
import { auth, db } from '../../lib/firebase';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';

const Detail = () => {
    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
    const { currentUser } = useUserStore();

    const handleBlock = async () => {
        if (!user) return;

        const userDocRef = doc(db, "users", currentUser.id);
        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
            });
            changeBlock();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className='detail'>
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
                <h2>{user?.username}</h2>
                <p>Lorem ipsum dolor sit amet</p>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat Settings</span>
                        <img src="./arrowUp.png" alt="Expand" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Privacy & help</span>
                        <img src="./arrowUp.png" alt="Expand" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared photos</span>
                        <img src="./arrowDown.png" alt="Expand" />
                    </div>
                    <div className="photos">
                        {[...Array(2)].map((_, index) => (
                            <div className="photoItem" key={index}>
                                <div className="photoDetail">
                                    <img src="https://thumbs.dreamstime.com/b/christmas-star-background-6396494.jpg" alt="Shared" />
                                    <span>photo_2024_2.png</span>
                                </div>
                                <img src="./download.png" alt="Download" className='icon' />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared Files</span>
                        <img src="./arrowUp.png" alt="Expand" />
                    </div>
                </div>

                {/* Buttons Section */}
                <div className='button-container'>
                    <button className='block-btn' onClick={handleBlock}>
                        {isCurrentUserBlocked ? "You are Blocked!" : isReceiverBlocked ? "User blocked" : "Block User"}
                    </button>
                    <button className='logout' onClick={() => auth.signOut()}>Logout</button>
                </div>
            </div>
        </div>
    );
};

export default Detail;
