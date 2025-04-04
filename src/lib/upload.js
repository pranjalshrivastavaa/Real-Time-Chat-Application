import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

const upload = async (file) => {
    try {
        if (!file) throw new Error("No file selected!");

        // Generate a unique filename using timestamp
        const timestamp = new Date().getTime();
        const storageRef = ref(storage, `images/${timestamp}_${file.name}`);

        console.log("Starting upload for:", file.name);

        // Upload the file
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress.toFixed(2)}%`);
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(`Upload failed: ${error.message}`);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log("Upload successful! File available at:", downloadURL);
                        resolve(downloadURL);
                    } catch (urlError) {
                        console.error("Error getting download URL:", urlError);
                        reject("Failed to get file URL.");
                    }
                }
            );
        });
    } catch (err) {
        console.error("Upload function error:", err);
        throw new Error("File upload failed!");
    }
};

export default upload;
