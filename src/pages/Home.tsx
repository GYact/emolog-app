import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

// Highlightドキュメントの型定義
interface Highlight {
  id: string;
  userId: string;
  photoURL: string;
  emotion: string;
  memo?: string;
  createdAt: Timestamp;
}

const Home = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.coupleId) return;

    const q = query(
      collection(db, 'highlights'),
      where('coupleId', '==', userProfile.coupleId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const highlightsData: Highlight[] = [];
      querySnapshot.forEach((doc) => {
        highlightsData.push({ id: doc.id, ...doc.data() } as Highlight);
      });
      setHighlights(highlightsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div>
      <h2>Timeline</h2>
      <p>Welcome, {user?.email}!</p>
      
      <div>
        <Link to="/create-highlight">
          <button>+ 新しいハイライトを投稿する</button>
        </Link>
      </div>

      <hr />

      <div>
        <h3>Shared Highlights</h3>
        {loading ? (
          <p>Loading timeline...</p>
        ) : highlights.length > 0 ? (
          <ul>
            {highlights.map((highlight) => (
              <li key={highlight.id}>
                <p>Posted by: {highlight.userId}</p>
                <p>Emotion: {highlight.emotion}</p>
                {highlight.photoURL && <img src={highlight.photoURL} alt="highlight" style={{ maxWidth: '200px' }} />}
              </li>
            ))}
          </ul>
        ) : (
          <p>まだ投稿がありません。最初のハイライトを投稿してみましょう！</p>
        )}
      </div>

      <button onClick={handleLogout} style={{ marginTop: '20px' }}>Log Out</button>
    </div>
  );
};

export default Home; 