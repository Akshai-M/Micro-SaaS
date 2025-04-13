import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addLink } from './linkSlice';
import {
  Link as LinkIcon,
  Calendar,
  Wand2,
  Rocket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LinkForm = () => {
  const [longUrl, setLongUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://micro-saas-jpd3.onrender.com/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl, alias, expirationDate, userId: 'user123' }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(addLink({ longUrl, shortUrl: data.shortUrl, alias, expirationDate }));
        alert('🚀 Short link created successfully!');
        setLongUrl('');
        setAlias('');
        setExpirationDate('');
        navigate('/dashboard'); 
      } else {
        alert('❌ Error creating short link');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Create Short Link</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Long URL</label>
          <div className="relative">
            <input
              type="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <LinkIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Alias (optional)</label>
          <div className="relative">
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <Rocket className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (optional)</label>
          <div className="relative">
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-300 shadow-md"
        >
          Create Link
        </button>
      </form>
    </div>
  );
};

export default LinkForm;
