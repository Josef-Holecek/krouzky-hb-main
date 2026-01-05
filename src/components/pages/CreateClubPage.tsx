'use client';

import { useState, useEffect } from 'react';
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
import { Upload, ArrowRight } from 'lucide-react';

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

export function CreateClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params?.id as string | undefined;
  const isEditMode = !!clubId;
  
  const { userProfile, isAuthenticated } = useAuth();
  const { createClub, updateClub, fetchClubById, uploadClubImage } = useClubs();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClub, setIsLoadingClub] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Základ
    name: '',
    category: '',
    description: '',
    // Logo
    image: null as File | null,
    // Kontakt
    address: '',
    dayTime: '',
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
    // Souhlas
    termsAccepted: false,
  });

  // Load club data if editing
  useEffect(() => {
    if (isEditMode && clubId && userProfile?.uid) {
      const loadClub = async () => {
        setIsLoadingClub(true);
        const club = await fetchClubById(clubId);
        if (club) {
          // Check if user owns this club
          if (club.createdBy !== userProfile.uid) {
            toast.error('Nemáte oprávnění upravit tento kroužek');
            router.push('/krouzky');
            return;
          }
          
          setFormData({
            name: club.name,
            category: club.category,
            description: club.description,
            image: null,
            address: club.address,
            dayTime: club.dayTime,
            trainerName: club.trainerName,
            trainerEmail: club.trainerEmail,
            trainerPhone: club.trainerPhone || '',
            web: club.web || '',
            ageFrom: club.ageFrom.toString(),
            ageTo: club.ageTo.toString(),
            level: club.level,
            capacity: club.capacity.toString(),
            price: club.price.toString(),
            termsAccepted: true,
          });
        } else {
          toast.error('Kroužek nebyl nalezen');
          router.push('/krouzky');
        }
        setIsLoadingClub(false);
      };
      loadClub();
    }
  }, [isEditMode, clubId, fetchClubById, userProfile?.uid, router]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Obrázek je příliš velký (max 5 MB)');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setImageName(file.name);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      termsAccepted: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.description) {
      toast.error('Vyplňte povinná pole (název, kategorie, popis)');
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
      const clubData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        address: formData.address,
        dayTime: formData.dayTime,
        trainerName: formData.trainerName,
        trainerEmail: formData.trainerEmail,
        trainerPhone: formData.trainerPhone,
        web: formData.web,
        ageFrom: parseInt(formData.ageFrom) || 0,
        ageTo: parseInt(formData.ageTo) || 99,
        level: formData.level,
        capacity: parseInt(formData.capacity) || 1,
        price: parseInt(formData.price) || 0,
      };

      if (isEditMode && clubId) {
        // Update existing club
        let imageUrl = undefined;
        
        // Upload new image if provided
        if (formData.image) {
          imageUrl = await uploadClubImage(formData.image, clubId);
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
          if (formData.image) {
            const imageUrl = await uploadClubImage(formData.image, result.clubId);
            if (imageUrl) {
              // Update club with image URL
              await updateClub(result.clubId, { image: imageUrl });
            }
          }
          
          toast.success('Kroužek byl úspěšně vytvořen!');
          setTimeout(() => router.push('/krouzky'), 1500);
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
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleSelectChange('category', value)
                      }
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
                </div>

                <div>
                  <Label htmlFor="description">Krátký popis *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Popište váš kroužek, cíle a co se budou účastníci učit..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo/Obrázek */}
            <Card>
              <CardHeader>
                <CardTitle>Logo nebo obrázek kroužku</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <label htmlFor="image" className="cursor-pointer">
                    <span className="text-sm font-medium hover:text-primary">
                      Kliknutím sem nahrajte obrázek
                    </span>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG do 5 MB
                  </p>
                  {imageName && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {imageName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

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
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dayTime">Den a čas konání *</Label>
                  <Input
                    id="dayTime"
                    name="dayTime"
                    placeholder="Například: Úterý 16:00-17:30"
                    value={formData.dayTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="trainerName">Jméno trenéra/vedoucího *</Label>
                  <Input
                    id="trainerName"
                    name="trainerName"
                    placeholder="Váše jméno"
                    value={formData.trainerName}
                    onChange={handleInputChange}
                    required
                  />
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
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="trainerPhone">Telefon</Label>
                    <Input
                      id="trainerPhone"
                      name="trainerPhone"
                      placeholder="+420 xxx xxx xxx"
                      value={formData.trainerPhone}
                      onChange={handleInputChange}
                    />
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
                  />
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
                      placeholder="6"
                      value={formData.ageFrom}
                      onChange={handleInputChange}
                      min="0"
                      max="120"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageTo">Do věku *</Label>
                    <Input
                      id="ageTo"
                      name="ageTo"
                      type="number"
                      placeholder="15"
                      value={formData.ageTo}
                      onChange={handleInputChange}
                      min="0"
                      max="120"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Kapacita osob *</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      placeholder="20"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
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
                      required
                    />
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
              <Button type="submit" disabled={isLoading}>
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
