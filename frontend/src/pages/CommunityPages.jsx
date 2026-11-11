import React from 'react';
import { useState } from 'react';
import { AlertTriangle, Plus, ThumbsUp, Sparkles, AlertCircle, Send } from 'lucide-react';

export function PagePublications({ store, setStore, currentUser, toggleLikePost, handleAddComment, setActiveModal, showToast }) {
  const [commentInputs, setCommentInputs] = useState({});

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Create post launcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
        <button 
          onClick={() => setActiveModal('create-post')}
          className="flex-1 text-left py-2.5 px-4 bg-slate-100 hover:bg-slate-200/70 rounded-xl text-xs text-slate-500 font-medium transition-colors"
        >
          Partagez une nouvelle action ou actualité solidaire...
        </button>
        <button 
          onClick={() => setActiveModal('create-post')} 
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {store.posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            
            {/* Post Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={post.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <span>{post.authorName}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">{post.authorRole}</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">{post.date}</span>
                </div>
              </div>

              {/* AI Moderation Badge */}
              <div className="flex items-center space-x-2">
                {post.aiFlag ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>⚠️ AI Moderation Warning</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-100">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Analysé par l’IA</span>
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>

            {/* Optional Image */}
            {post.image && (
              <div className="rounded-xl overflow-hidden max-h-80 bg-slate-100">
                <img src={post.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 text-xs">
              <button 
                onClick={() => toggleLikePost(post.id)}
                className={`flex items-center space-x-1.5 font-semibold transition-colors ${
                  post.isLiked ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-emerald-600' : ''}`} />
                <span>{post.likes} J’aime</span>
              </button>

              <span className="text-slate-300">|</span>

              <span className="text-slate-500 font-medium">
                {post.comments.length} commentaires
              </span>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5 pt-2 bg-slate-50 p-3.5 rounded-xl">
              {post.comments.map(c => (
                <div key={c.id} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{c.author}</span>
                    <span className="text-[10px] text-slate-400">{c.date}</span>
                  </div>
                  <p className="text-slate-600">{c.content}</p>
                </div>
              ))}

              {/* Add Comment Input */}
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="text" 
                  placeholder="Écrire un commentaire..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button 
                  onClick={() => {
                    handleAddComment(post.id, commentInputs[post.id] || '');
                    setCommentInputs({ ...commentInputs, [post.id]: '' });
                  }}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

// --- ESPACE UTILISATEUR: SIGNALEMENTS ---

export function PageSignalements({ store, setStore, currentUser, setActiveModal, showToast }) {
  const userReports = store.reports.filter(r => r.reporterName === currentUser.name || currentUser.role === 'Admin');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Mes Signalements & Notifications</h2>
          <p className="text-xs text-slate-500">Suivi des alertes de modération émises</p>
        </div>
        <button 
          onClick={() => setActiveModal('create-report')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm"
        >
          <AlertCircle className="w-4 h-4" />
          <span>Créer un signalement</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {userReports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucun signalement soumis pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {userReports.map(rep => (
              <div key={rep.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{rep.type}</span>
                    <h4 className="font-bold text-slate-800 text-sm">{rep.targetTitle}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{rep.reason}</p>
                  <span className="text-[10px] text-slate-400">Date : {rep.date}</span>
                </div>

                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    rep.status === 'Résolu' ? 'bg-emerald-100 text-emerald-800' :
                    rep.status === 'Pris en charge' ? 'bg-sky-100 text-sky-800' :
                    rep.status === 'Rejeté' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rep.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESPACE CITOYEN: CAMPAGNES ---
