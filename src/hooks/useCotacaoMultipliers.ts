// Hook consolidado para gerenciar multiplicadores e divisores
import { useState, useEffect } from 'react';

export function useCotacaoMultipliers() {
  const [changeDolarDivisor, setChangeDolarDivisor] = useState<string>(() => {
    return sessionStorage.getItem('changeDolarDivisor') || "1";
  });
  
  const [changeDolarTotalDivisor, setChangeDolarTotalDivisor] = useState<string>(() => {
    return sessionStorage.getItem('changeDolarTotalDivisor') || "1";
  });
  
  const [multiplicadorReais, setMultiplicadorReais] = useState<string>(() => {
    return sessionStorage.getItem('multiplicadorReais') || "5.44";
  });
  
  const [multiplicadorReaisTotal, setMultiplicadorReaisTotal] = useState<string>(() => {
    return sessionStorage.getItem('multiplicadorReaisTotal') || "5.44";
  });

  // Efeito consolidado para persistir todos os valores
  useEffect(() => {
    const values = {
      changeDolarDivisor,
      changeDolarTotalDivisor,
      multiplicadorReais,
      multiplicadorReaisTotal
    };

    Object.entries(values).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });
  }, [changeDolarDivisor, changeDolarTotalDivisor, multiplicadorReais, multiplicadorReaisTotal]);

  return {
    changeDolarDivisor,
    setChangeDolarDivisor,
    changeDolarTotalDivisor,
    setChangeDolarTotalDivisor,
    multiplicadorReais,
    setMultiplicadorReais,
    multiplicadorReaisTotal,
    setMultiplicadorReaisTotal
  };
}
