import { useState } from 'react';
import { Keypad, Mail } from 'lucide-react';

export default function Login() {
  const [loginMethod, setLoginMethod] = useState('pin'); // 'pin' o 'email'
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Acá luego conectaremos con el Backend de Ezequiel/Germán
    console.log('Intentando ingresar con:', loginMethod === 'pin' ? { pin } : { email, password });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Chit&Go
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ingreso para personal del local
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Pestañas para elegir el método */}
          <div className="flex justify-center mb-6 border-b pb-2">
            <button 
              className={`mr-4 pb-2 px-2 font-medium ${loginMethod === 'pin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setLoginMethod('pin')}
            >
              <Keypad className="inline w-5 h-5 mr-1"/> Acceso PIN
            </button>
            <button 
              className={`pb-2 px-2 font-medium ${loginMethod === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setLoginMethod('email')}
            >
              <Mail className="inline w-5 h-5 mr-1"/> Acceso Admin
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {loginMethod === 'pin' ? (
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                  Tu PIN de Empleado
                </label>
                <div className="mt-1">
                  <input
                    id="pin"
                    type="password"
                    maxLength="10"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                    placeholder="****"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ingresar al sistema
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
