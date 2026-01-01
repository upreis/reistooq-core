import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Avatares pré-definidos para seleção
const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Dakota',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emery',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Finley',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Harley',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kennedy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Logan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
];

interface AvatarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar?: string | null;
  onAvatarChange: (avatarUrl: string | null) => void;
  userName?: string;
}

export function AvatarSelectionModal({
  open,
  onOpenChange,
  currentAvatar,
  onAvatarChange,
  userName = 'Usuário',
}: AvatarSelectionModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validar tamanho (800KB)
    if (file.size > 800 * 1024) {
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadPreview(result);
      setSelectedAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onAvatarChange(selectedAvatar);
    onOpenChange(false);
  };

  const handleRemove = () => {
    setSelectedAvatar(null);
    setUploadPreview(null);
  };

  const getInitials = () => {
    return userName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Avatar</DialogTitle>
          <DialogDescription>
            Escolha um avatar ou faça upload de sua própria imagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview do Avatar Atual */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={selectedAvatar || undefined} alt="Avatar" />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {selectedAvatar && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemove}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{userName}</p>
          </div>

          {/* Botão de Upload */}
          <div className="flex justify-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Fazer Upload
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            JPG, PNG ou GIF. Máximo 800KB.
          </p>

          {/* Grade de Avatares Pré-definidos */}
          <div>
            <p className="text-sm font-medium mb-3">Ou escolha um avatar</p>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setUploadPreview(null);
                  }}
                  className={cn(
                    'relative group rounded-full transition-all',
                    selectedAvatar === avatar
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:ring-2 hover:ring-muted-foreground/30'
                  )}
                >
                  <Avatar className="w-14 h-14 transition-transform group-hover:scale-105">
                    <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                    <AvatarFallback>{index + 1}</AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Avatar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
