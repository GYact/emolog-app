import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

const PartnerConnect = () => {
  const { user } = useAuth();
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !partnerCode) {
      setError('パートナーのコードを入力してください。');
      return;
    }
    if (user.uid === partnerCode) {
      setError('自分自身と連携することはできません。');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const partnerDocRef = doc(db, 'users', partnerCode);
      const partnerDoc = await getDoc(partnerDocRef);

      if (!partnerDoc.exists()) {
        throw new Error('入力されたコードのユーザーが見つかりません。');
      }

      if (partnerDoc.data()?.partnerId) {
        throw new Error('入力されたコードのユーザーは既に別のパートナーと連携済みです。');
      }

      // バッチ書き込みでアトミックな操作を実行
      const batch = writeBatch(db);

      // 1. 新しいカップルドキュメントを作成
      const coupleDocRef = doc(db, 'couples', `${user.uid}_${partnerCode}`); // シンプルなID生成
      batch.set(coupleDocRef, {
        members: [user.uid, partnerCode],
        createdAt: serverTimestamp(),
      });

      // 2. 自分のユーザードキュメントを更新
      const userDocRef = doc(db, 'users', user.uid);
      batch.update(userDocRef, {
        partnerId: partnerCode,
        coupleId: coupleDocRef.id,
      });

      // 3. パートナーのユーザードキュメントを更新
      batch.update(partnerDocRef, {
        partnerId: user.uid,
        coupleId: coupleDocRef.id,
      });

      await batch.commit();
      // 成功後、AuthContextが自動でリッスンして状態が更新され、AppRouterによってHomeに遷移するはず
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>パートナーと連携する</h2>
      <p>パートナーと連携して、思い出の共有を始めましょう。</p>
      
      <div>
        <h3>あなたの招待コード</h3>
        <p>以下のコードをパートナーに教えてあげてください。</p>
        <input type="text" value={user?.uid} readOnly />
      </div>

      <hr />

      <form onSubmit={handleConnect}>
        <h3>パートナーの招待コードを入力</h3>
        <input
          type="text"
          value={partnerCode}
          onChange={(e) => setPartnerCode(e.target.value)}
          placeholder="パートナーのコード"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '連携中...' : '連携する'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default PartnerConnect; 