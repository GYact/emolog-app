import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CreateHighlight = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [emotion, setEmotion] = useState('');
  const [memo, setMemo] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile?.coupleId) {
      setError('ユーザー情報が取得できません。');
      return;
    }
    if (!imageFile) {
      setError('写真を選択してください。');
      return;
    }
    if (!emotion) {
      setError('感情を選択してください。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload image to Firebase Storage
      const imageRef = ref(storage, `highlights/${userProfile.coupleId}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const photoURL = await getDownloadURL(snapshot.ref);

      // 2. Add highlight document to Firestore
      await addDoc(collection(db, 'highlights'), {
        userId: user.uid,
        coupleId: userProfile.coupleId,
        photoURL,
        emotion,
        memo,
        createdAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err: any) {
      setError('投稿に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>今日のハイライトを投稿</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>写真:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} required />
        </div>
        <div>
          <label>今日の感情は？</label>
          {/* 簡単なボタンで感情を選択 */}
          <div>
            <button type="button" onClick={() => setEmotion('happy')} className={emotion === 'happy' ? 'selected' : ''}>😄 嬉しい</button>
            <button type="button" onClick={() => setEmotion('love')} className={emotion === 'love' ? 'selected' : ''}>🥰 大好き</button>
            <button type="button" onClick={() => setEmotion('fun')} className={emotion === 'fun' ? 'selected' : ''}>😂 面白い</button>
            <button type="button" onClick={() => setEmotion('thanks')} className={emotion === 'thanks' ? 'selected' : ''}>🙏 感謝</button>
          </div>
        </div>
        <div>
          <label>メモ (任意):</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '投稿中...' : '投稿する'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default CreateHighlight; 