import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Megaphone, Eye, Trash2 } from "lucide-react";
import { GlobalNoticeBar, GlobalNotice, Tone } from './GlobalNoticeBar';

export function NoticeConfigSection() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    tone: 'warning' as Tone,
    collapsible: true
  });

  const [currentNotice, setCurrentNotice] = useState<GlobalNotice | null>(null);

  useEffect(() => {
    // Load current notice from localStorage
    const saved = localStorage.getItem('reistoq.globalNotice.data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentNotice(parsed);
        setFormData({
          title: parsed.title || '',
          message: parsed.message || '',
          tone: parsed.tone || 'warning',
          collapsible: parsed.collapsible !== false
        });
      } catch (e) {
        console.warn('Invalid notice data in localStorage');
      }
    }
  }, []);

  const handleSave = () => {
    const notice: GlobalNotice = {
      id: 'global',
      title: formData.title.trim() || undefined,
      message: formData.message.trim(),
      tone: formData.tone,
      collapsible: formData.collapsible
    };

    if (!notice.message) {
      alert('A mensagem é obrigatória');
      return;
    }

    localStorage.setItem('reistoq.globalNotice.data', JSON.stringify(notice));
    
    // Clear dismissal if notice content changed
    localStorage.removeItem('reistoq.globalNotice.dismissed.global');
    
    setCurrentNotice(notice);
    
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'reistoq.globalNotice.data',
      newValue: JSON.stringify(notice)
    }));

    alert('Aviso salvo com sucesso!');
  };

  const handleClear = () => {
    if (confirm('Tem certeza que deseja remover o aviso atual?')) {
      localStorage.removeItem('reistoq.globalNotice.data');
      localStorage.removeItem('reistoq.globalNotice.dismissed.global');
      setCurrentNotice(null);
      setFormData({
        title: '',
        message: '',
        tone: 'warning',
        collapsible: true
      });
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'reistoq.globalNotice.data',
        newValue: null
      }));

      alert('Aviso removido com sucesso!');
    }
  };

  const previewNotice: GlobalNotice = {
    id: 'preview',
    title: formData.title.trim() || undefined,
    message: formData.message.trim() || 'Digite uma mensagem para ver a pré-visualização',
    tone: formData.tone,
    collapsible: formData.collapsible
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Avisos do Sistema
        </CardTitle>
        <CardDescription>
          Configure avisos globais que aparecerão no topo de todas as páginas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="notice-title">Título (opcional)</Label>
              <Input
                id="notice-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Manutenção programada"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="notice-message">Mensagem</Label>
              <Textarea
                id="notice-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Ex: Sistema ficará indisponível por 30 minutos"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notice-tone">Tom do Aviso</Label>
              <Select value={formData.tone} onValueChange={(value: Tone) => setFormData({ ...formData, tone: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Aviso (Amarelo)</SelectItem>
                  <SelectItem value="info">Informação (Azul)</SelectItem>
                  <SelectItem value="success">Sucesso (Verde)</SelectItem>
                  <SelectItem value="danger">Perigo (Vermelho)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Recolhível</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que usuários recolham o aviso
                </p>
              </div>
              <Switch
                checked={formData.collapsible}
                onCheckedChange={(checked) => setFormData({ ...formData, collapsible: checked })}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <Label>Pré-visualização</Label>
          </div>
          <div className="border rounded p-4 bg-muted/50">
            <GlobalNoticeBar notice={previewNotice} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1 md:flex-none">
            Salvar Aviso
          </Button>
          {currentNotice && (
            <Button variant="outline" onClick={handleClear} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Limpar Aviso
            </Button>
          )}
        </div>

        {/* Current Notice Info */}
        {currentNotice && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="text-sm">
                <strong>Aviso atual:</strong> {currentNotice.title ? `${currentNotice.title} - ` : ''}{currentNotice.message}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}