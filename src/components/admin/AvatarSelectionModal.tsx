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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lista de seeds para gerar mais de 100 avatares únicos
const AVATAR_SEEDS = [
  'Felix', 'Aneka', 'Bailey', 'Charlie', 'Dakota', 'Emery', 'Finley', 'Harley', 'Jordan', 'Kennedy',
  'Logan', 'Morgan', 'Parker', 'Quinn', 'Riley', 'Sage', 'Taylor', 'Avery', 'Blake', 'Cameron',
  'Drew', 'Eden', 'Frankie', 'Gray', 'Hayden', 'Indigo', 'Jamie', 'Kai', 'Lane', 'Micah',
  'Noel', 'Oakley', 'Peyton', 'River', 'Sawyer', 'Tatum', 'Val', 'Winter', 'Xen', 'Yuri',
  'Zion', 'Alex', 'Ash', 'Brook', 'Cory', 'Dallas', 'Ellis', 'Flynn', 'Gene', 'Harper',
  'Ira', 'Jesse', 'Kit', 'Lee', 'Max', 'Nico', 'Onyx', 'Pat', 'Ray', 'Sam',
  'Terry', 'Uma', 'Vic', 'Wren', 'Xander', 'Yael', 'Zeke', 'Arden', 'Billie', 'Casey',
  'Devon', 'Emerson', 'Fallon', 'Greer', 'Hollis', 'Ivory', 'Jules', 'Kerry', 'Lennox', 'Milan',
  'Navy', 'Ocean', 'Phoenix', 'Raven', 'Shiloh', 'True', 'Urban', 'Venice', 'West', 'Zephyr',
  'Addison', 'Brooklyn', 'Campbell', 'Denver', 'Essex', 'Florence', 'Geneva', 'Hudson', 'Ireland', 'Justice',
];

// Gerar avatares com diferentes estilos do DiceBear
const AVATAR_STYLES = ['avataaars', 'bottts', 'lorelei', 'micah', 'notionists', 'open-peeps', 'personas', 'pixel-art', 'thumbs'];

// Gerar lista completa de avatares
const generateAvatarList = () => {
  const avatars: { url: string; style: string; seed: string }[] = [];
  
  AVATAR_STYLES.forEach((style) => {
    AVATAR_SEEDS.slice(0, 12).forEach((seed) => {
      avatars.push({
        url: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`,
        style,
        seed,
      });
    });
  });
  
  return avatars;
};

const PRESET_AVATARS = generateAvatarList();

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

          {/* Grade de Avatares Pré-definidos com Scroll */}
          <div>
            <p className="text-sm font-medium mb-3">Ou escolha um avatar ({PRESET_AVATARS.length} opções)</p>
            <ScrollArea className="h-[300px] rounded-md border p-3">
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedAvatar(avatar.url);
                      setUploadPreview(null);
                    }}
                    className={cn(
                      'relative group rounded-full transition-all',
                      selectedAvatar === avatar.url
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'hover:ring-2 hover:ring-muted-foreground/30'
                    )}
                    title={`${avatar.style} - ${avatar.seed}`}
                  >
                    <Avatar className="w-12 h-12 transition-transform group-hover:scale-105">
                      <AvatarImage src={avatar.url} alt={`Avatar ${index + 1}`} />
                      <AvatarFallback className="text-[10px]">{index + 1}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </ScrollArea>
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
