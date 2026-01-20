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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  publicLocation: string;
  availability: string;
  certificates: string;
  trainingTypes: string;
  image: File | null;
  portraitImage: File | null;
  certificateImages: File[];
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
  const [certificatePreviews, setCertificatePreviews] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Array<{ day: string; timeFrom: string; timeTo: string }>>([
    { day: '', timeFrom: '', timeTo: '' },
  ]);
  
  // Portrait image state
  const [portraitImageName, setPortraitImageName] = useState<string | null>(null);
  const [portraitImagePreview, setPortraitImagePreview] = useState<string | null>(null);
  const [rawPortraitUrl, setRawPortraitUrl] = useState<string | null>(null);
  const [rawPortraitFile, setRawPortraitFile] = useState<File | null>(null);
  const [portraitDimensions, setPortraitDimensions] = useState<{ width: number; height: number } | null>(null);
  const [portraitSelection, setPortraitSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isPortraitDragging, setIsPortraitDragging] = useState(false);
  const [portraitDragOffset, setPortraitDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const portraitWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isPortraitCropDialogOpen, setIsPortraitCropDialogOpen] = useState(false);

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
    publicLocation: '',
    availability: '',
    certificates: '',
    trainingTypes: '',
    image: null,
    portraitImage: null,
    certificateImages: [],
    termsAccepted: false,
  });

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      if (portraitImagePreview && portraitImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(portraitImagePreview);
      }
      if (rawPortraitUrl && rawPortraitUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawPortraitUrl);
      }
      // Cleanup certificate previews
      certificatePreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreview, portraitImagePreview, rawPortraitUrl, certificatePreviews]);

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
            publicLocation: trainer.publicLocation || '',
            availability: trainer.availability || '',
            certificates: trainer.certificates || '',
            trainingTypes: trainer.trainingTypes || '',
            
            image: null,
            portraitImage: null,
            certificateImages: [],
            termsAccepted: true,
          });
          
          // Parse availability into schedules
          if (trainer.availability) {
            const slots = trainer.availability
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
          
          if (trainer.image) {
            setImagePreview(trainer.image);
            setRawImageUrl(trainer.image);
            setImageName('Aktuální obrázek');
          }
          // Load portrait image
          if (trainer.portraitImage) {
            setPortraitImagePreview(trainer.portraitImage);
            setPortraitImageName('Aktuální portrét');
          }
          // Load existing certificate images
          if (trainer.certificateImages && trainer.certificateImages.length > 0) {
            setCertificatePreviews(trainer.certificateImages);
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

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({ ...prev, phone: digitsOnly }));
      return;
    }

    if (name === 'experience') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 2);
      setFormData((prev) => ({ ...prev, experience: digitsOnly }));
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

  const handleScheduleChange = (index: number, field: string, value: string) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setSchedules(updatedSchedules);
  };

  const handleAddSchedule = () => {
    setSchedules([...schedules, { day: '', timeFrom: '', timeTo: '' }]);
  };

  const handleRemoveSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const handleCertificateImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 5 images total
    const totalImages = formData.certificateImages.length + files.length;
    if (totalImages > 5) {
      toast.error('Můžete nahrát maximálně 5 obrázků certifikátů');
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Každý obrázek musí být menší než 5 MB');
      return;
    }

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setCertificatePreviews(prev => [...prev, ...newPreviews]);
    
    setFormData(prev => ({
      ...prev,
      certificateImages: [...prev.certificateImages, ...files]
    }));
  };

  const removeCertificateImage = (index: number) => {
    const preview = certificatePreviews[index];
    
    // Only revoke blob URLs (newly uploaded files), not http URLs (existing images)
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
      // Also remove from formData.certificateImages
      setFormData(prev => ({
        ...prev,
        certificateImages: prev.certificateImages.filter((_, i) => i !== index)
      }));
    }
    
    // Remove from previews
    setCertificatePreviews(prev => prev.filter((_, i) => i !== index));
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

  const handlePortraitImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Portrait image selected:', file?.name);
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Obrázek musí být menší než 5 MB');
        return;
      }
      const newUrl = URL.createObjectURL(file);
      console.log('Portrait blob URL created:', newUrl);
      if (rawPortraitUrl && rawPortraitUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawPortraitUrl);
      }
      if (portraitImagePreview && portraitImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(portraitImagePreview);
      }
      setRawPortraitUrl(newUrl);
      setRawPortraitFile(file);
      setFormData((prev) => ({
        ...prev,
        portraitImage: file,
      }));
      setPortraitImageName(file.name);
      setPortraitImagePreview(null);
      setPortraitDimensions(null);
      setPortraitSelection(null);
      console.log('Opening portrait crop dialog');
      setIsPortraitCropDialogOpen(true);
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
      // Never use crossOrigin for blob URLs
      img.onload = () => resolve(img);
      img.onerror = (error) => {
        const errorMsg = `Failed to load image: ${src.substring(0, 50)}...`;
        console.error('Image load error:', errorMsg, error);
        reject(new Error(errorMsg));
      };
      img.src = src;
    });
  };

  const cropImageToFile = async (): Promise<File | null> => {
    try {
      if (!rawImageUrl || !selection) {
        toast.error('Chybí obrázek nebo výběr oblasti');
        return null;
      }
      const img = await loadImage(rawImageUrl);
      const canvas = document.createElement('canvas');
      canvas.width = selection.width;
      canvas.height = selection.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Nelze vytvořit canvas kontext');
        return null;
      }
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
    } catch (error) {
      console.error('Crop error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Chyba při ořezávání banneru: ${errorMessage}`);
      return null;
    }
  };

  const handleApplyCrop = async () => {
    try {
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
    } catch (error) {
      console.error('Apply crop error:', error);
      toast.error('Chyba při aplikaci výřezu banneru');
    }
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

  // Portrait crop functions
  const initializePortraitSelection = (width: number, height: number) => {
    // Square selection (1:1 aspect ratio)
    const size = Math.min(width, height);
    setPortraitSelection({
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size,
    });
  };

  const handlePortraitImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    console.log('Portrait image loaded:', naturalWidth, 'x', naturalHeight);
    setPortraitDimensions({ width: naturalWidth, height: naturalHeight });
    initializePortraitSelection(naturalWidth, naturalHeight);
  };

  const cropPortraitToFile = async (): Promise<File | null> => {
    try {
      console.log('Starting portrait crop, rawPortraitUrl:', rawPortraitUrl);
      console.log('Portrait selection:', portraitSelection);
      if (!rawPortraitUrl || !portraitSelection) {
        console.log('Missing rawPortraitUrl or portraitSelection');
        toast.error('Chybí obrázek nebo výběr oblasti portrétu');
        return null;
      }
      console.log('Loading portrait image...');
      const img = await loadImage(rawPortraitUrl);
      console.log('Portrait image loaded successfully');
      const canvas = document.createElement('canvas');
      canvas.width = portraitSelection.width;
      canvas.height = portraitSelection.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Failed to get canvas context');
        toast.error('Nelze vytvořit canvas kontext');
        return null;
      }
      ctx.drawImage(
        img,
        portraitSelection.x,
        portraitSelection.y,
        portraitSelection.width,
        portraitSelection.height,
        0,
        0,
        portraitSelection.width,
        portraitSelection.height
      );
      console.log('Drawing to canvas complete');

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.log('Failed to create blob from canvas');
            reject(new Error('Nepodařilo se vytvořit výřez'));
            return;
          }
          console.log('Blob created successfully, size:', blob.size);
          const fileName = rawPortraitFile?.name || 'portrait.png';
          const file = new File([blob], fileName, { type: blob.type || 'image/png' });
          console.log('Portrait file created:', file.name, file.size);
          resolve(file);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Portrait crop error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Chyba při ořezávání portrétu: ${errorMessage}`);
      return null;
    }
  };

  const handleApplyPortraitCrop = async () => {
    try {
      const file = await cropPortraitToFile();
      if (!file) return;
      if (portraitImagePreview && portraitImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(portraitImagePreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, portraitImage: file }));
      setPortraitImagePreview(previewUrl);
      setPortraitImageName(file.name);
      setIsPortraitCropDialogOpen(false);
    } catch (error) {
      console.error('Apply portrait crop error:', error);
      toast.error('Chyba při aplikaci výřezu portrétu');
    }
  };

  const handlePortraitDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!portraitSelection || !portraitWrapperRef.current || !portraitDimensions) return;
    const rect = portraitWrapperRef.current.getBoundingClientRect();
    const scaleX = portraitDimensions.width / rect.width;
    const scaleY = portraitDimensions.height / rect.height;
    const pointerX = (event.clientX - rect.left) * scaleX;
    const pointerY = (event.clientY - rect.top) * scaleY;
    setPortraitDragOffset({ x: pointerX - portraitSelection.x, y: pointerY - portraitSelection.y });
    setIsPortraitDragging(true);
  };

  const handlePortraitDragMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPortraitDragging) return;
    event.preventDefault();
    event.stopPropagation();
    if (!portraitSelection || !portraitWrapperRef.current || !portraitDimensions) return;
    const rect = portraitWrapperRef.current.getBoundingClientRect();
    const scaleX = portraitDimensions.width / rect.width;
    const scaleY = portraitDimensions.height / rect.height;
    const targetX = (event.clientX - rect.left) * scaleX - portraitDragOffset.x;
    const targetY = (event.clientY - rect.top) * scaleY - portraitDragOffset.y;
    const clampedX = Math.min(Math.max(0, targetX), portraitDimensions.width - portraitSelection.width);
    const clampedY = Math.min(Math.max(0, targetY), portraitDimensions.height - portraitSelection.height);
    setPortraitSelection((prev) => (prev ? { ...prev, x: clampedX, y: clampedY } : prev));
  };

  const handlePortraitDragEnd = () => {
    setIsPortraitDragging(false);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      termsAccepted: checked,
    }));
  };

  const isPhoneInvalid = formData.phone && formData.phone.length !== 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Vyplňte povinná pole (jméno, email)');
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
        publicLocation: formData.publicLocation,
        availability: schedules
          .filter(s => s.day && s.timeFrom && s.timeTo)
          .map(s => `${s.day} ${s.timeFrom}-${s.timeTo}`)
          .join('; '),
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

        // Upload portrait image if provided
        if (formData.portraitImage) {
          const portraitUrl = await uploadTrainerImage(formData.portraitImage, trainerId);
          if (portraitUrl) {
            Object.assign(trainerData, { portraitImage: portraitUrl });
          }
        }

        // Handle certificate images - combine existing URLs with newly uploaded files
        const existingCertUrls = certificatePreviews.filter(url => url.startsWith('http'));
        const newCertFiles = formData.certificateImages;
        
        if (newCertFiles.length > 0) {
          const newCertUrls: string[] = [];
          for (const certFile of newCertFiles) {
            const certUrl = await uploadTrainerImage(certFile, trainerId);
            if (certUrl) {
              newCertUrls.push(certUrl);
            }
          }
          // Combine existing URLs with new URLs
          const allCertUrls = [...existingCertUrls, ...newCertUrls];
          Object.assign(trainerData, { certificateImages: allCertUrls });
        } else if (existingCertUrls.length > 0) {
          // Keep existing URLs if no new files uploaded
          Object.assign(trainerData, { certificateImages: existingCertUrls });
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

          // Upload portrait image after trainer is created
          if (formData.portraitImage) {
            const portraitUrl = await uploadTrainerImage(formData.portraitImage, result.trainerId);
            if (portraitUrl) {
              await updateTrainer(result.trainerId, { portraitImage: portraitUrl });
            }
          }

          // Upload certificate images after trainer is created
          if (formData.certificateImages.length > 0) {
            const certificateUrls: string[] = [];
            for (const certFile of formData.certificateImages) {
              const certUrl = await uploadTrainerImage(certFile, result.trainerId);
              if (certUrl) {
                certificateUrls.push(certUrl);
              }
            }
            if (certificateUrls.length > 0) {
              await updateTrainer(result.trainerId, { certificateImages: certificateUrls });
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.name.length}/100
                  </div>
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.email.length}/120
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground px-2 py-2 border rounded-md bg-muted">+420</span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="123 456 789"
                      value={formatPhoneDisplay(formData.phone)}
                      onChange={handleInputChange}
                      maxLength={11}
                      className={isPhoneInvalid ? 'border-red-500' : ''}
                    />
                  </div>
                  {isPhoneInvalid && (
                    <p className="text-xs text-red-600 mt-1">Zadejte 9 číslic</p>
                  )}
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.phone.length}/9
                  </div>
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.web.length}/200
                  </div>
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
                  <Label htmlFor="publicLocation">Kde jsem dostupný / Kde trénuji (veřejné)</Label>
                  <Input
                    id="publicLocation"
                    name="publicLocation"
                    maxLength={150}
                    value={formData.publicLocation}
                    onChange={handleInputChange}
                    placeholder="Např. Sportovní hala Havlíčkův Brod, Online"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Toto se zobrazí veřejně na vašem profilu
                  </p>
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.publicLocation.length}/150
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Poštovní adresa (neveřejné)</Label>
                  <Input
                    id="address"
                    name="address"
                    maxLength={150}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ulice 123, 123 45 Město"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tato adresa nebude veřejně zobrazena
                  </p>
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.address.length}/150
                  </div>
                </div>
                <div>
                  <Label>Dostupnost - tréninkové časy</Label>
                  <p className="text-xs text-muted-foreground mb-3">Zadejte časy, kdy jste dostupní pro tréninky</p>
                  <div className="space-y-3">
                    {schedules.map((slot, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <Label>Den</Label>
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
                          <Label htmlFor={`timeFrom-${index}`}>Čas od</Label>
                          <Input
                            id={`timeFrom-${index}`}
                            type="time"
                            value={slot.timeFrom}
                            onChange={(e) => handleScheduleChange(index, 'timeFrom', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label htmlFor={`timeTo-${index}`}>Čas do</Label>
                          <Input
                            id={`timeTo-${index}`}
                            type="time"
                            value={slot.timeTo}
                            onChange={(e) => handleScheduleChange(index, 'timeTo', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                          {schedules.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveSchedule(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={handleAddSchedule}>
                      + Přidat další čas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Profilové obrázky</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Banner Image */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Banner (pozadí profilu)</Label>
                  <label htmlFor="image" className="block">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      {imagePreview ? (
                        <div className="space-y-3">
                          <div className="aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
                            <img
                              src={imagePreview}
                              alt="Náhled banneru"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="text-sm text-green-600">✓ Banner připraven</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            Klikněte nebo přetáhněte obrázek banneru
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
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Portrait Image */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Portrétní fotka (levý dolní roh)</Label>
                  <label htmlFor="portraitImage" className="block">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      {portraitImagePreview ? (
                        <div className="space-y-3">
                          <div className="w-48 h-48 mx-auto overflow-hidden rounded-md border border-border bg-muted">
                            <img
                              src={portraitImagePreview}
                              alt="Náhled portrétu"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="text-sm text-green-600">✓ Portrét připraven</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            Klikněte nebo přetáhněte portrétní fotku
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            PNG, JPG do 5 MB (ideálně čtvercová)
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      id="portraitImage"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePortraitImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>
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

            {/* Portrait Crop Dialog */}
            <Dialog open={isPortraitCropDialogOpen} onOpenChange={setIsPortraitCropDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle className="text-2xl">Upravit portrétní fotku</DialogTitle>
                  <DialogDescription>
                    Přesuňte bílý čtvercový rámeček na oblast, kterou chcete zobrazit jako portrét
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6 overflow-auto">
                  <div
                    ref={portraitWrapperRef}
                    className="relative w-full max-h-[60vh] overflow-hidden rounded-lg bg-black/5 mb-4"
                    onMouseLeave={handlePortraitDragEnd}
                    onMouseUp={handlePortraitDragEnd}
                    onMouseMove={handlePortraitDragMove}
                  >
                    {rawPortraitUrl && (
                      <>
                        <img
                          src={rawPortraitUrl}
                          alt="Nahraný portrét"
                          className="block w-full h-auto max-h-[60vh] object-contain"
                          onLoad={handlePortraitImageLoad}
                        />
                        {portraitSelection && portraitDimensions && (
                          <div
                            className="absolute border-4 border-white shadow-xl cursor-move rounded-full"
                            style={{
                              left: `${(portraitSelection.x / portraitDimensions.width) * 100}%`,
                              top: `${(portraitSelection.y / portraitDimensions.height) * 100}%`,
                              width: `${(portraitSelection.width / portraitDimensions.width) * 100}%`,
                              height: `${(portraitSelection.height / portraitDimensions.height) * 100}%`,
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                            }}
                            onMouseDown={handlePortraitDragStart}
                          >
                            <div className="absolute inset-0 border-2 border-white/50 rounded-full" />
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
                        setIsPortraitCropDialogOpen(false);
                        if (rawPortraitUrl && rawPortraitUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(rawPortraitUrl);
                        }
                        setRawPortraitUrl(null);
                        setRawPortraitFile(null);
                        setPortraitSelection(null);
                        setPortraitDimensions(null);
                      }}
                    >
                      Zrušit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleApplyPortraitCrop()}
                      disabled={!portraitSelection || !rawPortraitUrl}
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.specialization.length}/100
                  </div>
                </div>
                <div>
                  <Label htmlFor="experience">Roky zkušeností</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    inputMode="numeric"
                    maxLength={2}
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="5"
                    min="0"
                    max="99"
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.bio.length}/1000
                  </div>
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.trainingTypes.length}/500
                  </div>
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.certificates.length}/500
                  </div>
                </div>

                {/* Certificate Images Upload */}
                <div>
                  <Label htmlFor="certificateImages">Obrázky certifikátů a diplomů</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Nahrajte fotky svých certifikátů a diplomů (max. 5 obrázků, každý do 5 MB)
                  </p>
                  
                  {/* Upload Button */}
                  {formData.certificateImages.length < 5 && (
                    <label htmlFor="certificateImages" className="block">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          Klikněte nebo přetáhněte obrázky
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          PNG, JPG do 5 MB ({formData.certificateImages.length}/5)
                        </div>
                      </div>
                      <input
                        id="certificateImages"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleCertificateImagesChange}
                        className="sr-only"
                      />
                    </label>
                  )}

                  {/* Preview Grid */}
                  {certificatePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {certificatePreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                          <img
                            src={preview}
                            alt={`Certifikát ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeCertificateImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.instagram.length}/100
                  </div>
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
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.facebook.length}/200
                  </div>
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
