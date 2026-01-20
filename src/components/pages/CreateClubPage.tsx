'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClubs } from '@/hooks/useClubs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, ArrowRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const categories = [
  { value: 'sport', label: 'Sport' },
  { value: 'hudba', label: 'Hudba' },
  { value: 'jazyky', label: 'Jazyky' },
  { value: 'technika', label: 'Technika' },
  { value: 'umeni', label: 'Umění' },
  { value: 'tanec', label: 'Tanec' },
  { value: 'veda', label: 'Věda' },
  { value: 'ostatni', label: 'Ostatní' },
];

const levels = [
  { value: 'beginner', label: 'Začátečník' },
  { value: 'intermediate', label: 'Pokročilý' },
  { value: 'advanced', label: 'Pokročilý +' },
  { value: 'all', label: 'Všechny úrovně' },
];

const pricePeriods = [
  { value: 'per_lesson', label: 'Za lekci' },
  { value: 'monthly', label: 'Měsíčně' },
  { value: 'quarterly', label: 'Čtvrtletně' },
  { value: 'semester', label: 'Za semestr' },
  { value: 'yearly', label: 'Ročně' },
  { value: 'one_time', label: 'Jednorázově' },
];

export function CreateClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params?.id as string | undefined;
  const isEditMode = !!clubId;
  const bannerAspect = 4 / 3;
  
  const { userProfile, isAuthenticated } = useAuth();
  const { createClub, updateClub, fetchClubById, uploadClubImage } = useClubs();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClub, setIsLoadingClub] = useState(false);
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
  const [schedules, setSchedules] = useState<Array<{ day: string; timeFrom: string; timeTo: string }>>([
    { day: '', timeFrom: '', timeTo: '' },
  ]);

  const [formData, setFormData] = useState({
    // Základ
    name: '',
    category: '',
    description: '',
    // Logo
    image: null as File | null,
    // Kontakt
    address: '',
    trainerName: '',
    trainerEmail: '',
    trainerPhone: '',
    web: '',
    // Detaily
    ageFrom: '',
    ageTo: '',
    level: '',
    capacity: '',
    price: '',
    pricePeriod: '',
    // Souhlas
    termsAccepted: false,
  });

  useEffect(() => {
    if (isEditMode && clubId && userProfile?.uid) {
      const loadClub = async () => {
        setIsLoadingClub(true);
        const club = await fetchClubById(clubId);
        if (club) {
          if (club.createdBy !== userProfile.uid) {
            toast.error('Nemáte oprávnění upravit tento kroužek');
            router.push('/krouzky');
            return;
          }

          const nextAgeFrom = club.ageFrom;
          const nextAgeTo = club.ageTo <= club.ageFrom ? club.ageFrom + 1 : club.ageTo;

          setFormData({
            name: club.name,
            category: club.category,
            description: club.description,
            image: null,
            address: club.address,
            trainerName: club.trainerName,
            trainerEmail: club.trainerEmail,
            trainerPhone: club.trainerPhone
              ? club.trainerPhone.replace(/^\+?420/, '').replace(/\D/g, '').slice(0, 9)
              : '',
            web: club.web || '',
            ageFrom: nextAgeFrom.toString(),
            ageTo: nextAgeTo.toString(),
            level: club.level,
            capacity: club.capacity.toString(),
            price: club.price.toString(),
            pricePeriod: club.pricePeriod || '',
            termsAccepted: true,
          });

          if (club.dayTime) {
            const slots = club.dayTime
              .split(';')
              .map((slot) => slot.trim())
              .filter(Boolean);
            const parsed = slots.map((slot) => {
              const match = slot.match(/^(\S+)\s+([0-9:]+)-([0-9:]+)/);
              return {
                day: match?.[1] || '',
                timeFrom: match?.[2] || '',
                timeTo: match?.[3] || '',
              };
            });
            if (parsed.length) {
              setSchedules(parsed);
            }
          }

          if (club.image) {
            setImagePreview(club.image);
            setRawImageUrl(club.image);
            setImageName('Aktuální obrázek');
          }
        } else {
          toast.error('Kroužek nebyl nalezen');
          router.push('/krouzky');
        }
        setIsLoadingClub(false);
      };

      loadClub();
    }
  }, [isEditMode, clubId, fetchClubById, userProfile?.uid, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'trainerPhone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({ ...prev, trainerPhone: digitsOnly }));
      return;
    }

    if (name === 'ageFrom' || name === 'ageTo' || name === 'capacity') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 2);
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '').slice(0, 9);
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleChange = (
    index: number,
    field: 'day' | 'timeFrom' | 'timeTo',
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddSchedule = () => {
    setSchedules((prev) => [...prev, { day: '', timeFrom: '', timeTo: '' }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Obrázek je příliš velký (max 5 MB)');
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
          reject(new Error('Nepodařilo se vytvořit výřez')); // unlikely
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
    if (!isDragging || !selection || !imageWrapperRef.current || !imageDimensions) return;
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

  const ageFromNumber = parseInt(formData.ageFrom, 10);
  const ageToNumber = parseInt(formData.ageTo, 10);
  const isAgeOrderInvalid = !isNaN(ageFromNumber) && !isNaN(ageToNumber) && ageFromNumber >= ageToNumber;
  
  const isAgeFromInvalid = formData.ageFrom && (isNaN(ageFromNumber) || ageFromNumber < 0 || ageFromNumber > 99);
  const isAgeToInvalid = formData.ageTo && (isNaN(ageToNumber) || ageToNumber < 0 || ageToNumber > 99);
  const capacityNumber = parseInt(formData.capacity, 10);
  const isCapacityInvalid = formData.capacity && (isNaN(capacityNumber) || capacityNumber < 1 || capacityNumber > 99);
  const isPhoneInvalid = formData.trainerPhone && formData.trainerPhone.length !== 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Vyplňte název kroužku');
      return;
    }

    if (!formData.category) {
      toast.error('Vyberte kategorii kroužku');
      return;
    }

    if (!formData.description) {
      toast.error('Vyplňte popis kroužku');
      return;
    }

    if (isPhoneInvalid) {
      toast.error('Telefonní číslo musí mít formát: 9 číslic');
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

    if (!formData.pricePeriod) {
      toast.error('Vyberte frekvenci ceny');
      return;
    }

    const ageFrom = parseInt(formData.ageFrom) || 0;
    const ageTo = parseInt(formData.ageTo) || 0;
    if (ageFrom >= ageTo) {
      toast.error('Věk "Od" musí být menší než "Do"');
      return;
    }

    const hasPartialSchedule = schedules.some(
      (slot) => (slot.day || slot.timeFrom || slot.timeTo) && !(slot.day && slot.timeFrom && slot.timeTo)
    );
    if (hasPartialSchedule) {
      toast.error('Vyplňte den i oba časy pro každý řádek nebo ho odeberte');
      return;
    }

    const completeSchedules = schedules.filter(
      (slot) => slot.day && slot.timeFrom && slot.timeTo
    );
    if (!completeSchedules.length) {
      toast.error('Přidejte alespoň jeden termín');
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

      const dayTime = completeSchedules
        .map((slot) => `${slot.day} ${slot.timeFrom}-${slot.timeTo}`)
        .join('; ');
      
      const clubData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        address: formData.address,
        dayTime,
        trainerName: formData.trainerName,
        trainerEmail: formData.trainerEmail,
        trainerPhone: formData.trainerPhone ? `+420${formData.trainerPhone}` : '',
        web: formData.web,
        ageFrom,
        ageTo,
        level: formData.level,
        capacity: parseInt(formData.capacity) || 1,
        price: parseInt(formData.price) || 0,
        pricePeriod: formData.pricePeriod,
      };

      if (isEditMode && clubId) {
        // Update existing club
        let imageUrl = undefined;
        
        // Upload new image if provided
        if (imageFileForUpload) {
          imageUrl = await uploadClubImage(imageFileForUpload, clubId);
          if (imageUrl) {
            Object.assign(clubData, { image: imageUrl });
          }
        }
        
        const result = await updateClub(clubId, clubData);
        if (result.success) {
          toast.success('Kroužek byl úspěšně aktualizován!');
          setTimeout(() => router.push(`/krouzky/${clubId}`), 1500);
        } else {
          toast.error(result.error || 'Chyba při aktualizaci kroužku');
        }
      } else {
        // Create new club
        const result = await createClub(clubData, userProfile.uid);
        if (result.success && result.clubId) {
          // Upload image after club is created
          if (imageFileForUpload) {
            const imageUrl = await uploadClubImage(imageFileForUpload, result.clubId);
            if (imageUrl) {
              // Update club with image URL
              await updateClub(result.clubId, { image: imageUrl });
            }
          }
          
          toast.success('Kroužek byl odeslán ke schválení administrátorem. Najdete ho v "Moje kroužky".');
          setTimeout(() => router.push('/krouzky/moje'), 1500);
        } else {
          toast.error(result.error || 'Chyba při vytváření kroužku');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(isEditMode ? 'Chyba při aktualizaci kroužku' : 'Chyba při vytváření kroužku');
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
                Pro vytvoření kroužku se musíte nejdříve přihlásit.
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

  if (isLoadingClub) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Načítání kroužku...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="bg-secondary py-12">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-2">
            {isEditMode ? 'Upravit kroužek' : 'Registrace kroužku'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? 'Aktualizujte informace o vašem kroužku'
              : 'Založte svůj vlastní kroužek a sdílejte svou vášeň s ostatními'
            }
          </p>
          {!isEditMode && (
            <p className="text-sm text-amber-700 mt-2">
              Po odeslání musí administrátor kroužek schválit, teprve poté bude veřejně viditelný.
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
                  <Label htmlFor="name">Název kroužku *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Například: Fotbalová škola"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength={100}
                    required
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.name.length}/100
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Kategorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte kategorii" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">O kroužku *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Stručně představte kroužek, cíle a náplň."
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={1000}
                    required
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.description.length}/1000
                  </div>
                </div>

                <div className="space-y-3">
                  {schedules.map((slot, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-4">
                        <Label>Den *</Label>
                        <Select
                          value={slot.day}
                          onValueChange={(value) => handleScheduleChange(index, 'day', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte den" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pondělí">Pondělí</SelectItem>
                            <SelectItem value="Úterý">Úterý</SelectItem>
                            <SelectItem value="Středa">Středa</SelectItem>
                            <SelectItem value="Čtvrtek">Čtvrtek</SelectItem>
                            <SelectItem value="Pátek">Pátek</SelectItem>
                            <SelectItem value="Sobota">Sobota</SelectItem>
                            <SelectItem value="Neděle">Neděle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor={`timeFrom-${index}`}>Čas od *</Label>
                        <Input
                          id={`timeFrom-${index}`}
                          type="time"
                          value={slot.timeFrom}
                          onChange={(e) => handleScheduleChange(index, 'timeFrom', e.target.value)}
                          required
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor={`timeTo-${index}`}>Čas do *</Label>
                        <Input
                          id={`timeTo-${index}`}
                          type="time"
                          value={slot.timeTo}
                          onChange={(e) => handleScheduleChange(index, 'timeTo', e.target.value)}
                          required
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        {schedules.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleRemoveSchedule(index)}
                          >
                            Odebrat
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={handleAddSchedule}>
                    + Přidat další čas
                  </Button>
                </div>
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
                        <div className="text-sm font-medium hover:text-primary">
                          Kliknutím sem nahrajte banner kroužku
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG do 5 MB (poměr 4:3)
                        </p>
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

            {/* Kontakt */}
            <Card>
              <CardHeader>
                <CardTitle>Kontaktní informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Adresa / Místo konání *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Ulice, město"
                    value={formData.address}
                    onChange={handleInputChange}
                    maxLength={200}
                    required
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.address.length}/200
                  </div>
                </div>

                <div>
                  <Label htmlFor="trainerName">Jméno trenéra/vedoucího *</Label>
                  <Input
                    id="trainerName"
                    name="trainerName"
                    placeholder="Váše jméno"
                    value={formData.trainerName}
                    onChange={handleInputChange}
                    maxLength={100}
                    required
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.trainerName.length}/100
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trainerEmail">E-mail *</Label>
                    <Input
                      id="trainerEmail"
                      name="trainerEmail"
                      type="email"
                      placeholder="vase@email.cz"
                      value={formData.trainerEmail}
                      onChange={handleInputChange}
                      maxLength={120}
                      required
                    />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                      {formData.trainerEmail.length}/120
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="trainerPhone">Telefon</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground px-2 py-2 border rounded-md bg-muted">+420</span>
                      <Input
                        id="trainerPhone"
                        name="trainerPhone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="123 456 789"
                        value={formatPhoneDisplay(formData.trainerPhone)}
                        onChange={handleInputChange}
                        maxLength={11}
                        className={isPhoneInvalid ? 'border-red-500' : ''}
                      />
                    </div>
                    {isPhoneInvalid && (
                      <p className="text-xs text-red-600 mt-1">Zadejte 9 číslic</p>
                    )}
                    <div className="text-right text-xs text-muted-foreground mt-1">
                      {formData.trainerPhone.length}/9
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="web">Web / sociální sítě (nepovinné)</Label>
                  <Input
                    id="web"
                    name="web"
                    placeholder="https://..."
                    value={formData.web}
                    onChange={handleInputChange}
                    maxLength={200}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.web.length}/200
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detaily */}
            <Card>
              <CardHeader>
                <CardTitle>Detaily kroužku</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="ageFrom">Od věku *</Label>
                    <Input
                      id="ageFrom"
                      name="ageFrom"
                      type="number"
                      inputMode="numeric"
                      placeholder="6"
                      value={formData.ageFrom}
                      onChange={handleInputChange}
                      min="0"
                      max="99"
                      maxLength={2}
                      required
                      className={isAgeFromInvalid || isAgeOrderInvalid ? 'border-red-500' : ''}
                    />
                    {isAgeFromInvalid && (
                      <p className="text-xs text-red-600 mt-1">Zadejte číslo 0–99</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ageTo">Do věku *</Label>
                    <Input
                      id="ageTo"
                      name="ageTo"
                      type="number"
                      inputMode="numeric"
                      placeholder="15"
                      value={formData.ageTo}
                      onChange={handleInputChange}
                      min="0"
                      max="99"
                      maxLength={2}
                      required
                      className={isAgeToInvalid || isAgeOrderInvalid ? 'border-red-500' : ''}
                    />
                    {isAgeToInvalid && (
                      <p className="text-xs text-red-600 mt-1">Zadejte číslo 0–99</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="capacity">Kapacita osob *</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      inputMode="numeric"
                      placeholder="20"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                      max="99"
                      maxLength={2}
                      required
                      className={isCapacityInvalid ? 'border-red-500' : ''}
                    />
                    {isCapacityInvalid && (
                      <p className="text-xs text-red-600 mt-1">Zadejte číslo 1–99</p>
                    )}
                  </div>
                </div>

                {isAgeOrderInvalid && (
                  <p className="text-sm text-red-600 font-medium">⚠ Věk "Od" musí být menší než "Do"</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Cena (Kč) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="2500"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      max="999999"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePeriod">Jak často *</Label>
                    <Select
                      value={formData.pricePeriod}
                      onValueChange={(value) => handleSelectChange('pricePeriod', value)}
                    >
                      <SelectTrigger id="pricePeriod">
                        <SelectValue placeholder="Zvolte frekvenci" />
                      </SelectTrigger>
                      <SelectContent>
                        {pricePeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="level">Úroveň *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      handleSelectChange('level', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte úroveň" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Souhlas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Souhlasím se zpracováním mých údajů a podmínkami služby
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
              <Button type="submit" disabled={isLoading || isAgeOrderInvalid}>
                {isLoading 
                  ? (isEditMode ? 'Ukládání...' : 'Vytváření...') 
                  : (isEditMode ? 'Uložit změny' : 'Vytvořit kroužek')
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
