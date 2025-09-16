import * as React from 'react';

// Simple test component to verify React hooks work
const DevolucoesMercadoLivreUnificado: React.FC<any> = ({ mlAccounts = [], refetch }) => {
  console.log('🔧 DevolucoesMercadoLivreUnificado: Component iniciando...');
  
  const [testState, setTestState] = React.useState('initial');
  
  console.log('🔧 DevolucoesMercadoLivreUnificado: useState funcionando, testState:', testState);

  React.useEffect(() => {
    console.log('🔧 DevolucoesMercadoLivreUnificado: useEffect funcionando');
    setTestState('mounted');
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Devoluções ML - Teste</h1>
      <p>Estado de teste: {testState}</p>
      <p>Contas ML: {mlAccounts?.length || 0}</p>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">
          ✅ Component carregado com sucesso! React hooks funcionando.
        </p>
      </div>
    </div>
  );
};

export default DevolucoesMercadoLivreUnificado;