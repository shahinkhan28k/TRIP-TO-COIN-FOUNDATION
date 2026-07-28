import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  ThumbsUp, 
  MessageCircle, 
  Repeat, 
  Bookmark, 
  Eye, 
  Search, 
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Submission, SubmissionStatus } from '../types';

export const SubmissionHistoryView: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'submissions'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Submission);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubmissions(list);
      setLoading(false);
    }, (err) => {
      console.error('Submission history error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = submissions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch = sub.tweetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sub.note && sub.note.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Submission History</h1>
          <p className="text-xs text-slate-500">Track all your submitted TripToCoin promotional posts on X</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search post URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-sm">
          Loading submission history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <p className="text-slate-600 font-semibold text-sm">No submissions match your filter criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting search filters or submit a new promotion.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{sub.projectName} Promotional Post</span>
                    <a
                      href={sub.tweetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Open Tweet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-0.5 truncate max-w-xl">{sub.tweetUrl}</p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                  {sub.status === 'approved' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Approved
                    </span>
                  )}
                  {sub.status === 'pending' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Review
                    </span>
                  )}
                  {sub.status === 'rejected' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Engagement metrics & reward stats */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                    <strong>{sub.likes || 0}</strong> Likes
                  </span>
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <strong>{sub.replies || 0}</strong> Replies
                  </span>
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Repeat className="w-3.5 h-3.5 text-indigo-500" />
                    <strong>{sub.reposts || 0}</strong> Reposts
                  </span>
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                    <strong>{sub.bookmarks || 0}</strong> Bookmarks
                  </span>
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <strong>{sub.views || 0}</strong> Views
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  {sub.status === 'approved' && (
                    <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Reward: ${sub.rewardAmount || 0} USD ({sub.paymentStatus})
                    </div>
                  )}

                  <span className="text-slate-400">
                    Submitted: {new Date(sub.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Note / Rejection reason if present */}
              {sub.note && (
                <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100">
                  <span className="font-semibold text-slate-800">Note: </span>
                  {sub.note}
                </div>
              )}

              {sub.rejectionReason && (
                <div className="bg-rose-50 p-2.5 rounded-xl text-xs text-rose-800 border border-rose-100 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span><strong>Rejection Reason:</strong> {sub.rejectionReason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
