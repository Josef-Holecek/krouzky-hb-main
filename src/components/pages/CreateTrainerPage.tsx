'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrainers } from '@/hooks/useTrainers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type TrainerFormData = {
  name: string;
  email: string;
  phone: string;
  web: string;
  instagram: string;
  facebook: string;
  bio: string;
  specialization: string;
  experience: string;
  address: string;
  availability: string;
  certificates: string;
  trainingTypes: string;
  image: File | null;
  termsAccepted: boolean;
};

export function CreateTrainerPage() {
  const router = useRouter();
  const params = useParams();
  const trainerId = params?.id as string | undefined;
  const isEditMode = !!trainerId;
  const bannerAspect = 4 / 3;
  
  const { userProfile, isAuthenticated } = useAuth();
  const { createTrainer, updateTrainer, fetchTrainerById, uploadTrainerImage } = useTrainers();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrainer, setIsLoadingTrainer] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  const [formData, setFormData] = useState<TrainerFormData>({
    name: '',
    email: '',
    phone: '',
    web: '',
    instagram: '',
    facebook: '',
    bio: '',
    specialization: '',
    experience: '',
    address: '',
    availability: '',
    certificates: '',
    trainingTypes: '',
    image: null,
    termsAccepted: false,
  });

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Load trainer data if editing
  useEffect(() => {
    if (isEditMode && trainerId && userProfile?.uid) {
      const loadTrainer = async () => {
        setIsLoadingTrainer(true);
        const trainer = await fetchTrainerById(trainerId);
        if (trainer) {
          // Check if user owns this trainer profile
          if (trainer.createdBy !== userProfile.uid) {
            router.push('/treneri');
            return;
          }
          
          setFormData({
            name: trainer.name,
            email: trainer.email,
            phone: trainer.phone || '',
            bio: trainer.bio || '',
            specialization: trainer.specialization || '',
            experience: trainer.experience?.toString() || '',
            
            // Doplněno:
            web: trainer.web || '',
            instagram: trainer.instagram || '',
            facebook: trainer.facebook || '',
            address: trainer.address || '',
            availability: trainer.availability || '',
            certificates: trainer.certificates || '',
            trainingTypes: trainer.trainingTypes || '',
            
            image: null,
            termsAccepted: true,
          });
          if (trainer.image) {
            setImagePreview(trainer.image);
            setRawImageUrl(trainer.image);
            setImageName('Aktuální obrázek');
          }
        }
        setIsLoadingTrainer(false);
      };
      loadTrainer();
    }
  }, [isEditMode, trainerId, fetchTrainerById, userProfile?.uid, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const initializeSelection = (width: number, height: number) => {
    const maxWidth = Math.min(width, height * bannerAspect);
    const cropWidth = maxWidth;
    const cropHeight = cropWidth / bannerAspect;
    setSelection({
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
    initializeSelection(naturalWidth, naturalHeight);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Obrázek musí být menší než 5 MB');
        return;
      }
      const newUrl = URL.createObjectURL(file);
      if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawImageUrl);
      }
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setRawImageUrl(newUrl);
      setRawImageFile(file);
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setImageName(file.name);
      setImagePreview(null);
      setImageDimensions(null);
      setSelection(null);
      setIsCropDialogOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawImageUrl);
      }
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [rawImageUrl, imagePreview]);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const cropImageToFile = async (): Promise<File | null> => {
    if (!rawImageUrl || !selection) return null;
    const img = await loadImage(rawImageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = selection.width;
    canvas.height = selection.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(
      img,
      selection.x,
      selection.y,
      selection.width,
      selection.height,
      0,
      0,
      selection.width,
      selection.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Nepodařilo se vytvořit výřez'));
          return;
        }
        const fileName = rawImageFile?.name || 'cropped-image.png';
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });
        resolve(file);
      }, 'image/png');
    });
  };

  const handleApplyCrop = async () => {
    const file = await cropImageToFile();
    if (!file) return;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(previewUrl);
    setImageName(file.name);
    setIsCropDialogOpen(false);
  };

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selection || !imageWrapperRef.current || !imageDimensions) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    const pointerX = (event.clientX - rect.left) * scaleX;
    const pointerY = (event.clientY - rect.top) * scaleY;
    setDragOffset({ x: pointerX - selection.x, y: pointerY - selection.y });
    setIsDragging(true);
  };

  const handleDragMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    event.stopPropagation();
    if (!selection || !imageWrapperRef.current || !imageDimensions) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    const targetX = (event.clientX - rect.left) * scaleX - dragOffset.x;
    const targetY = (event.clientY - rect.top) * scaleY - dragOffset.y;
    const clampedX = Math.min(Math.max(0, targetX), imageDimensions.width - selection.width);
    const clampedY = Math.min(Math.max(0, targetY), imageDimensions.height - selection.height);
    setSelection((prev) => (prev ? { ...prev, x: clampedX, y: clampedY } : prev));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      termsAccepted: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Vyplňte povinná pole (jméno, email)');
      return;
    }

    if (!isEditMode && !formData.termsAccepted) {
      toast.error('Musíte souhlasit se zpracováním údajů');
      return;
    }

    if (!userProfile?.uid) {
      toast.error('Uživatel není přihlášen');
      return;
    }

    setIsLoading(true);

    try {
      let imageFileForUpload = formData.image;
      const canCrop = rawImageFile && selection && rawImageUrl?.startsWith('blob:');
      if (canCrop) {
        try {
          const cropped = await cropImageToFile();
          if (cropped) {
            imageFileForUpload = cropped;
            setFormData((prev) => ({ ...prev, image: cropped }));
            setImageName(cropped.name);
            if (!imagePreview || imagePreview.startsWith('http')) {
              const localPreview = URL.createObjectURL(cropped);
              setImagePreview(localPreview);
            }
          }
        } catch (cropError) {
          console.error('Crop error:', cropError);
          toast.error('Nepodařilo se oříznout obrázek. Zkuste to prosím znovu.');
        }
      }

      const trainerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        web: formData.web,
        instagram: formData.instagram,
        facebook: formData.facebook,
        bio: formData.bio,
        specialization: formData.specialization,
        experience: parseInt(formData.experience) || 0,
        address: formData.address,
        availability: formData.availability,
        certificates: formData.certificates,
        trainingTypes: formData.trainingTypes,
      };

      if (isEditMode && trainerId) {
        // Update existing trainer
        let imageUrl = undefined;
        
        // Upload new image if provided
        if (imageFileForUpload) {
          imageUrl = await uploadTrainerImage(imageFileForUpload, trainerId);
          if (imageUrl) {
            Object.assign(trainerData, { image: imageUrl });
          }
        }
        
        const result = await updateTrainer(trainerId, trainerData);
        if (result.success) {
          toast.success('Profil trenéra byl úspěšně aktualizován!');
          setTimeout(() => router.push(`/treneri/${trainerId}`), 1500);
        } else {
          toast.error(result.error || 'Chyba při aktualizaci profilu');
        }
      } else {
        // Create new trainer
        const result = await createTrainer(trainerData, userProfile.uid);
        if (result.success && result.trainerId) {
          // Upload image after trainer is created
          if (imageFileForUpload) {
            const imageUrl = await uploadTrainerImage(imageFileForUpload, result.trainerId);
            if (imageUrl) {
              // Update trainer with image URL
              await updateTrainer(result.trainerId, { image: imageUrl });
            }
          }
          
          toast.success('Profil trenéra byl odeslán ke schválení administrátorem.');
          setTimeout(() => router.push('/treneri'), 1500);
        } else {
          toast.error(result.error || 'Chyba při vytváření profilu');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(isEditMode ? 'Chyba při aktualizaci profilu' : 'Chyba při vytváření profilu');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <p className="text-amber-900">
                Pro vytvoření profilu trenéra se musíte nejdříve přihlásit.
              </p>
              <Button
                onClick={() => router.push('/prihlaseni')}
                className="mt-4"
              >
                Přejít na přihlášení
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (isLoadingTrainer) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Načítání profilu...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="bg-secondary py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-2">
            {isEditMode ? 'Upravit profil trenéra' : 'Vytvoření profilu trenéra'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? 'Aktualizujte váš profesní profil'
              : 'Vytvořte si profesní profil a sdílení své zkušenosti'
            }
          </p>
          {!isEditMode && (
            <p className="text-sm text-amber-700 mt-2">
              Po odeslání musí administrátor profil schválit, teprve poté se zobrazí veřejně.
            </p>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="container max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Základní informace */}
            <Card>
              <CardHeader>
                <CardTitle>Základní informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Jméno a příjmení *</Label>
                  <Input
                    id="name"
                    name="name"
                    maxLength={100}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Jan Novák"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    maxLength={120}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="trenér@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    maxLength={20}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+420 123 456 789"
                  />
                </div>
                <div>
                  <Label htmlFor="web">Web / Instagram / Facebook</Label>
                  <Input
                    id="web"
                    name="web"
                    maxLength={200}
                    value={formData.web}
                    onChange={handleInputChange}
                    placeholder="https://www.example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Adresa a dostupnost */}
            <Card>
              <CardHeader>
                <CardTitle>Umístění a dostupnost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Postálová adresa</Label>
                  <Input
                    id="address"
                    name="address"
                    maxLength={150}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ulice 123, 123 45 Město"
                  />
                </div>
                <div>
                  <Label htmlFor="availability">Dostupnost</Label>
                  <Textarea
                    id="availability"
                    name="availability"
                    maxLength={500}
                    value={formData.availability}
                    onChange={handleInputChange}
                    placeholder="Např. Pondělí-pátek 16:00-20:00, Sobota 10:00-12:00"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Profilový obrázek</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label htmlFor="image" className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
                          <img
                            src={imagePreview}
                            alt="Náhled ořezu"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-green-600">✓ Obrázek připraven</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          Klikněte nebo přetáhněte obrázek
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          PNG, JPG do 5 MB
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
              </CardContent>
            </Card>

            {/* Crop Dialog */}
            <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-2xl">Upravit obrázek</DialogTitle>
                  <DialogDescription>
                    Přesuňte bílý rámeček na oblast, kterou chcete zobrazit jako banner profilu
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6 overflow-auto">
                  <div
                    ref={imageWrapperRef}
                    className="relative w-full max-h-[60vh] overflow-hidden rounded-lg bg-black/5 mb-4"
                    onMouseLeave={handleDragEnd}
                    onMouseUp={handleDragEnd}
                    onMouseMove={handleDragMove}
                  >
                    {rawImageUrl && (
                      <>
                        <img
                          src={rawImageUrl}
                          alt="Nahraný obrázek"
                          className="block w-full h-auto max-h-[60vh] object-contain"
                          onLoad={handleImageLoad}
                        />
                        {selection && imageDimensions && (
                          <div
                            className="absolute border-4 border-white shadow-xl cursor-move"
                            style={{
                              left: `${(selection.x / imageDimensions.width) * 100}%`,
                              top: `${(selection.y / imageDimensions.height) * 100}%`,
                              width: `${(selection.width / imageDimensions.width) * 100}%`,
                              height: `${(selection.height / imageDimensions.height) * 100}%`,
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                            }}
                            onMouseDown={handleDragStart}
                          >
                            <div className="absolute inset-0 border-2 border-white/50" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCropDialogOpen(false);
                        if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(rawImageUrl);
                        }
                        setRawImageUrl(null);
                        setRawImageFile(null);
                        setSelection(null);
                        setImageDimensions(null);
                      }}
                    >
                      Zrušit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleApplyCrop()}
                      disabled={!selection || !rawImageUrl}
                    >
                      Potvrdit výřez
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Profesní informace */}
            <Card>
              <CardHeader>
                <CardTitle>Profesní informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="specialization">Specializace</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    maxLength={100}
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="např. Fotbal, Tenis, Tanec..."
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Roky zkušeností</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">O mně</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    maxLength={1000}
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Popište svou profesi, zkušenosti a přístup k výuce..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="trainingTypes">Typy tréninků</Label>
                  <Textarea
                    id="trainingTypes"
                    name="trainingTypes"
                    maxLength={500}
                    value={formData.trainingTypes}
                    onChange={handleInputChange}
                    placeholder="Např. Individuální tréninky, skupinové hodiny, online..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="certificates">Licence a certifikáty</Label>
                  <Textarea
                    id="certificates"
                    name="certificates"
                    maxLength={500}
                    value={formData.certificates}
                    onChange={handleInputChange}
                    placeholder="Např. Certifikátu FIVB, Trenér A třídy, apod."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sociální sítě */}
            <Card>
              <CardHeader>
                <CardTitle>Sociální sítě</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    maxLength={100}
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@vase_instagram"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    name="facebook"
                    maxLength={200}
                    value={formData.facebook}
                    onChange={handleInputChange}
                    placeholder="Odkaz na Facebook stránku"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Souhlas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    Souhlasím se zpracováním osobních údajů a zveřejněním mého profilu *
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (isEditMode ? 'Ukládání...' : 'Vytváření...') 
                  : (isEditMode ? 'Uložit změny' : 'Vytvořit profil')
                }
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
