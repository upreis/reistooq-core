import { useState, useEffect } from 'react';

export const usePersistentCalculators = () => {
  // Estados para divisores e multiplicadores com valores padrão e persistência
  const [changeDolarDivisor, setChangeDolarDivisor] = useState<string>(() => {
    const saved = sessionStorage.getItem('changeDolarDivisor');
    return saved || "1";
  });
  
  const [changeDolarTotalDivisor, setChangeDolarTotalDivisor] = useState<string>(() => {
    const saved = sessionStorage.getItem('changeDolarTotalDivisor');
    return saved || "1";
  });
  
  const [multiplicadorReais, setMultiplicadorReais] = useState<string>(() => {
    const saved = sessionStorage.getItem('multiplicadorReais');
    return saved || "5.44";
  });
  
  const [multiplicadorReaisTotal, setMultiplicadorReaisTotal] = useState<string>(() => {
    const saved = sessionStorage.getItem('multiplicadorReaisTotal');
    return saved || "5.44";
  });
  
  // Persistir divisores e multiplicadores quando mudarem
  useEffect(() => {
    sessionStorage.setItem('changeDolarDivisor', changeDolarDivisor);
  }, [changeDolarDivisor]);
  
  useEffect(() => {
    sessionStorage.setItem('changeDolarTotalDivisor', changeDolarTotalDivisor);
  }, [changeDolarTotalDivisor]);
  
  useEffect(() => {
    sessionStorage.setItem('multiplicadorReais', multiplicadorReais);
  }, [multiplicadorReais]);
  
  useEffect(() => {
    sessionStorage.setItem('multiplicadorReaisTotal', multiplicadorReaisTotal);
  }, [multiplicadorReaisTotal]);

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
};
