'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrainers } from '@/hooks/useTrainers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, Upload } from 'lucide-react';

export function CreateTrainerPage() {
  const router = useRouter();
  const params = useParams();
  const trainerId = params?.id as string | undefined;
  const isEditMode = !!trainerId;
  
  const { userProfile, isAuthenticated } = useAuth();
  const { createTrainer, updateTrainer, fetchTrainerById, uploadTrainerImage } = useTrainers();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrainer, setIsLoadingTrainer] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    image: null as File | null,
    termsAccepted: false,
  });

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
            web: (trainer as any).web || '',
            instagram: (trainer as any).instagram || '',
            facebook: (trainer as any).facebook || '',
            address: (trainer as any).address || '',
            availability: (trainer as any).availability || '',
            certificates: (trainer as any).certificates || '',
            trainingTypes: (trainer as any).trainingTypes || '',
            
            image: null,
            termsAccepted: true,
          });
        }
        setIsLoadingTrainer(false);
      };
      loadTrainer();
    }
  }, [isEditMode, trainerId, fetchTrainerById, userProfile?.uid, router]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Obrázek musí být menší než 5 MB');
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
        if (formData.image) {
          imageUrl = await uploadTrainerImage(formData.image, trainerId);
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
          if (formData.image) {
            const imageUrl = await uploadTrainerImage(formData.image, result.trainerId);
            if (imageUrl) {
              // Update trainer with image URL
              await updateTrainer(result.trainerId, { image: imageUrl });
            }
          }
          
          toast.success('Profil trenéra byl úspěšně vytvořen!');
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
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <label htmlFor="image" className="cursor-pointer">
                    <div className="text-sm text-muted-foreground">
                      Klikněte nebo přetáhněte obrázek
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      PNG, JPG do 5 MB
                    </div>
                  </label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imageName && (
                    <p className="text-sm text-primary mt-2">Vybrán: {imageName}</p>
                  )}
                </div>
              </CardContent>
            </Card>

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
