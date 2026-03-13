'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTrainers, type Trainer } from '@/hooks/useTrainers';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { ArrowLeft, Edit, MessageSquare, Briefcase, Award } from 'lucide-react';

const TrainerDetailPageComponent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const isPreview = searchParams?.get('preview') === '1';
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isCertificatesDialogOpen, setIsCertificatesDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { fetchTrainerById } = useTrainers();
  const { userProfile } = useAuth();
  const { sendMessage } = useMessages();
  const { toast } = useToast();

  useEffect(() => {
    const loadTrainer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const foundTrainer = await fetchTrainerById(id);
        if (foundTrainer) {
          setTrainer(foundTrainer);
        } else {
          setError('Trenér nebyl nalezen');
        }
      } catch (err) {
        console.error('Error loading trainer:', err);
        setError('Chyba při načítání profilu trenéra');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadTrainer();
    }
  }, [id, fetchTrainerById]);

  const handleSendMessage = async () => {
    if (!userProfile) {
      toast({
        title: 'Není možné odeslat zprávu',
        description: 'Pro odeslání zprávy musíte být přihlášeni.',
        variant: 'destructive',
      });
      return;
    }

    if (!trainer) return;

    if (!messageSubject.trim() || !messageText.trim()) {
      toast({
        title: 'Vyplňte všechna pole',
        description: 'Předmět a zpráva jsou povinné.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);
      await sendMessage(
        trainer.createdBy,
        trainer.name,
        trainer.id,
        trainer.name,
        messageSubject,
        messageText
      );

      toast({
        title: 'Zpráva odeslána',
        description: 'Vaše zpráva byla úspěšně odeslána trenérovi.',
      });

      setIsMessageDialogOpen(false);
      setMessageSubject('');
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Chyba při odesílání',
        description: 'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Načítání profilu...</p>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <section className="py-12">
        <div className="container">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-900">{error || 'Trenér nebyl nalezen'}</p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/treneri">Zpět na trenéry</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Back Button */}
      <div className="bg-secondary py-4">
        <div className="container">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/treneri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na trenéry
            </Link>
          </Button>
        </div>
      </div>

      <section className="py-8">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image & Title */}
              <div>
                <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gradient-to-br from-brand-navy to-brand-teal">
                  {/* Banner Image */}
                  {trainer.image ? (
                    <img
                      src={trainer.image}
                      alt={trainer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-9xl">👤</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Portrait Image in bottom left corner */}
                  {trainer.portraitImage && (
                    <div className="absolute bottom-4 left-4 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <img
                        src={trainer.portraitImage}
                        alt={`${trainer.name} - portrét`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4 mt-6">
                  <h1 className="text-3xl font-bold text-brand-navy">
                    {trainer.name}
                  </h1>
                  {userProfile?.uid === trainer.createdBy && (
                    <Button variant="outline" asChild>
                      <Link href={`/treneri/${trainer.id}/upravit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Upravit profil
                      </Link>
                    </Button>
                  )}
                </div>

                {trainer.specialization && (
                  <p className="text-lg text-brand-teal font-medium mb-2">
                    {trainer.specialization}
                  </p>
                )}
              </div>

              {/* Bio */}
              {trainer.bio && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">O mně</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {trainer.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {trainer.experience > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">Zkušenosti</h2>
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-6 w-6 text-primary" />
                      <span className="text-lg">
                        {trainer.experience} let odborné zkušenosti
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location and Availability */}
              {(trainer.publicLocation || trainer.availability) && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">Umístění a dostupnost</h2>
                    <div className="space-y-3">
                      {trainer.publicLocation && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Kde trénuji</p>
                          <p className="text-muted-foreground">{trainer.publicLocation}</p>
                        </div>
                      )}
                      {trainer.availability && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Dostupnost</p>
                          <p className="text-muted-foreground whitespace-pre-line">
                            {trainer.availability.split(';').map(s => s.trim()).join('\n')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Kontakt</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <a 
                        href={`mailto:${trainer.email}`}
                        className="text-primary hover:underline font-medium break-all text-sm"
                      >
                        {trainer.email}
                      </a>
                    </div>

                    {trainer.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Telefon</p>
                        <a 
                          href={`tel:${trainer.phone}`}
                          className="text-primary hover:underline font-medium text-sm"
                        >
                          {trainer.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {userProfile?.uid !== trainer.createdBy && (
                      <Button 
                        className="w-full" 
                        onClick={() => setIsMessageDialogOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Kontaktovat trenéra
                      </Button>
                    )}
                  </div>

                  {trainer.certificates && (
                    <div className="mt-3">
                      <Button 
                        variant="outline"
                        className="w-full" 
                        onClick={() => setIsCertificatesDialogOpen(true)}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Certifikáty
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Kontaktovat trenéra</DialogTitle>
            <DialogDescription>
              Odešlete zprávu trenérovi {trainer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Předmět</Label>
              <Input
                id="subject"
                placeholder="Např. Dotaz ohledně tréninku"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Zpráva</Label>
              <Textarea
                id="message"
                placeholder="Napište svou zprávu..."
                rows={6}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMessageDialogOpen(false)}
              disabled={isSending}
            >
              Zrušit
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending}>
              {isSending ? 'Odesílání...' : 'Odeslat zprávu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificates Dialog */}
      <Dialog open={isCertificatesDialogOpen} onOpenChange={setIsCertificatesDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certifikáty a diplomy</DialogTitle>
            <DialogDescription>
              Certifikáty a diplomy trenéra {trainer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {trainer.certificateImages && trainer.certificateImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {trainer.certificateImages.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                    <img
                      src={imageUrl}
                      alt={`Certifikát ${index + 1}`}
                      className="h-full w-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nejsou nahrány žádné obrázky certifikátů
              </p>
            )}
            {trainer.certificates && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Popis</h4>
                <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-line text-sm">
                  {trainer.certificates}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export function TrainerDetailPage() {
  return <TrainerDetailPageComponent />;
}
