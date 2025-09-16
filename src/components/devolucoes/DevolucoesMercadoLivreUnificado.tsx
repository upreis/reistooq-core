import * as React from 'react';

// Simple test component to verify React hooks work
const DevolucoesMercadoLivreUnificado: React.FC<any> = ({ mlAccounts = [], refetch }) => {
  console.log('🔧 DevolucoesMercadoLivreUnificado: Component iniciando...');
  
  const [testState, setTestState] = React.useState('initial');
  const [contador, setContador] = React.useState(0);
  
  console.log('🔧 DevolucoesMercadoLivreUnificado: useState funcionando, testState:', testState);

  React.useEffect(() => {
    console.log('🔧 DevolucoesMercadoLivreUnificado: useEffect funcionando');
    setTestState('mounted');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Devoluções Mercado Livre</h1>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800">✅ Status do Sistema</h2>
              <p className="text-green-700">Component carregado com sucesso! React hooks funcionando.</p>
              <p className="text-sm text-green-600">Estado: {testState}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800">📊 Informações</h2>
              <p className="text-blue-700">Contas ML disponíveis: {mlAccounts?.length || 0}</p>
              <p className="text-blue-700">Contador de teste: {contador}</p>
              <button 
                onClick={() => setContador(c => c + 1)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Incrementar Contador
              </button>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-800">🔧 Debug Info</h2>
              <p className="text-yellow-700">Esta é uma versão de teste do componente.</p>
              <p className="text-sm text-yellow-600">
                Se você está vendo esta mensagem, significa que:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-600 mt-2">
                <li>React hooks estão funcionando</li>
                <li>O componente está sendo renderizado</li>
                <li>A integração com a página principal está OK</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-purple-800">🚀 Próximos Passos</h2>
              <p className="text-purple-700">
                Agora que confirmamos que o React está funcionando, podemos:
              </p>
              <ol className="list-decimal list-inside text-sm text-purple-600 mt-2">
                <li>Restaurar o componente completo</li>
                <li>Implementar as funcionalidades avançadas</li>
                <li>Conectar com a API do Mercado Livre</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevolucoesMercadoLivreUnificado;