import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import govverify from '../assets/govverify.png';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await register(name, email, password, role);
      navigate('/login', { state: { success: 'Registration successful. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <main className="min-h-screen w-full relative">
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${govverify})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
      <div className="relative z-10 min-h-[130vh] flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="font-serif-display text-2xl text-white mb-6 text-center">
            Create your account
          </h1>

          {error && (
            <p className="bg-red-500/20 border border-red-300/50 text-white text-sm px-4 py-3 rounded-md mb-4 text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block mb-3">
              <span className="text-sm font-medium text-white/80">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-2"
              />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium text-white/80">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-2"
              />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium text-white/80">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2 text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1 mb-2"
              />
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium text-white/80">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white/90 backdrop-blur-sm border border-white/30 rounded-md px-4 py-2 text-ink-900 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1"
              >
                <option value="citizen">Citizen</option>
                <option value="officer">Officer</option>
              </select>
            </label>

            <button
              type="submit"
              className="w-full bg-white text-ink-900 font-semibold py-2.5 rounded-md hover:bg-white/90 transition"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Register;
