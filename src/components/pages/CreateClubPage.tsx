'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClubs, type Club, type ClubApprovalSnapshot, type ClubPendingChange } from '@/hooks/useClubs';
import { auth } from '@/lib/firebase';
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
import { Upload, ArrowRight, X, Crop } from 'lucide-react';
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
  const [originalClub, setOriginalClub] = useState<Club | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [isRecroppingExistingImage, setIsRecroppingExistingImage] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [schedules, setSchedules] = useState<Array<{ day: string; timeFrom: string; timeTo: string }>>([
    { day: '', timeFrom: '', timeTo: '' },
  ]);
  const [useCustomDayTime, setUseCustomDayTime] = useState(false);
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = !!userProfile?.isAdmin || (!!userProfile?.email && adminEmails.includes(userProfile.email.toLowerCase()));
  const isContactInfoOptional = isAdmin;

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    if (error instanceof DOMException && error.message) return error.message;
    if (typeof error === 'string') return error;
    try {
      const serialized = JSON.stringify(error);
      return serialized && serialized !== '{}' ? serialized : 'Neznámá chyba';
    } catch {
      return 'Neznámá chyba';
    }
  };

  const snapshotFields: Array<keyof ClubApprovalSnapshot> = [
    'name',
    'category',
    'description',
    'address',
    'dayTime',
    'trainerName',
    'trainerEmail',
    'trainerPhone',
    'web',
    'ageFrom',
    'ageTo',
    'level',
    'capacity',
    'availabilityNote',
    'price',
    'pricePeriod',
    'priceSemester',
    'priceYearly',
    'image',
    'imagePositionX',
    'imagePositionY',
  ];

  const fieldLabels: Record<string, string> = {
    name: 'Název',
    category: 'Kategorie',
    description: 'Popis',
    address: 'Adresa',
    dayTime: 'Čas konání',
    trainerName: 'Jméno trenéra',
    trainerEmail: 'Email trenéra',
    trainerPhone: 'Telefon trenéra',
    web: 'Web',
    ageFrom: 'Věk od',
    ageTo: 'Věk do',
    level: 'Úroveň',
    capacity: 'Volná místa',
    availabilityNote: 'Poznámka k volným místům',
    price: 'Základní cena',
    pricePeriod: 'Frekvence ceny',
    priceSemester: 'Cena za pololetí',
    priceYearly: 'Cena za rok',
    image: 'Obrázek',
    imagePositionX: 'Pozice obrázku X',
    imagePositionY: 'Pozice obrázku Y',
  };

  const formatSnapshotValue = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Ano' : 'Ne';
    if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
    return String(value);
  };

  const buildSnapshotFromClub = (club: Club): ClubApprovalSnapshot => ({
    name: club.name,
    category: club.category,
    description: club.description,
    address: club.address,
    dayTime: club.dayTime,
    trainerName: club.trainerName,
    trainerEmail: club.trainerEmail,
    trainerPhone: club.trainerPhone,
    web: club.web,
    ageFrom: club.ageFrom,
    ageTo: club.ageTo,
    level: club.level,
    capacity: club.capacity,
    availabilityNote: club.availabilityNote,
    price: club.price,
    pricePeriod: club.pricePeriod,
    priceSemester: club.priceSemester,
    priceYearly: club.priceYearly,
    image: club.image,
    imagePositionX: club.imagePositionX,
    imagePositionY: club.imagePositionY,
  });

  const buildSnapshotWithPatch = (club: Club, patch: Partial<Club>): ClubApprovalSnapshot => {
    const base = buildSnapshotFromClub(club);
    const next = { ...base };

    snapshotFields.forEach((field) => {
      if (patch[field] !== undefined) {
        next[field] = patch[field] as never;
      }
    });

    return next;
  };

  const buildPendingChanges = (
    beforeSnapshot: ClubApprovalSnapshot,
    afterSnapshot: ClubApprovalSnapshot
  ): ClubPendingChange[] => {
    const changes: ClubPendingChange[] = [];

    snapshotFields.forEach((field) => {
      const before = formatSnapshotValue(beforeSnapshot[field]);
      const after = formatSnapshotValue(afterSnapshot[field]);
      if (before !== after) {
        changes.push({
          field,
          label: fieldLabels[field] || field,
          before,
          after,
        });
      }
    });

    return changes;
  };

  const buildResubmissionMetadata = (patch: Partial<Club>): Partial<Club> => {
    if (!originalClub) {
      return {};
    }

    const currentSnapshot = buildSnapshotFromClub(originalClub);
    const editedSnapshot = buildSnapshotWithPatch(originalClub, patch);
    const changesFromCurrent = buildPendingChanges(currentSnapshot, editedSnapshot);

    if (originalClub.status === 'rejected') {
      if (!changesFromCurrent.length) {
        return {};
      }

      return {
        status: 'pending',
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectReason: null,
        pendingChanges: changesFromCurrent,
        resubmittedAt: new Date().toISOString(),
      };
    }

    if (originalClub.status !== 'approved') {
      return {};
    }

    const beforeSnapshot = originalClub.lastApprovedSnapshot || buildSnapshotFromClub(originalClub);
    const afterSnapshot = editedSnapshot;
    const changes = buildPendingChanges(beforeSnapshot, afterSnapshot);

    if (!changes.length) {
      return {};
    }

    return {
      status: 'pending',
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectReason: null,
      pendingChanges: changes,
      resubmittedAt: new Date().toISOString(),
    };
  };

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
    availabilityNote: '',
    price: '',
    pricePeriod: '',
    priceSemester: '',
    priceYearly: '',
    // Čas konání - vlastní text
    customDayTime: '',
    // Souhlas
    termsAccepted: false,
  });

  useEffect(() => {
    if (isEditMode && clubId && userProfile?.uid) {
      const loadClub = async () => {
        setIsLoadingClub(true);
        const club = await fetchClubById(clubId);
        if (club) {
          setOriginalClub(club);
          if (club.createdBy !== userProfile.uid && !isAdmin) {
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
            availabilityNote: club.availabilityNote || '',
            price: club.price.toString(),
            pricePeriod: club.pricePeriod || '',
            priceSemester: club.priceSemester ? club.priceSemester.toString() : '',
            priceYearly: club.priceYearly ? club.priceYearly.toString() : '',
            customDayTime: '',
            termsAccepted: true,
          });

          if (club.dayTime) {
            const slots = club.dayTime
              .split(';')
              .map((slot) => slot.trim())
              .filter(Boolean);
            
            // Check if it looks like structured data (e.g., "Pondělí 10:00-12:00")
            const isStructured = slots.every(slot => slot.match(/^(\S+)\s+([0-9:]+)-([0-9:]+)/));
            
            if (isStructured && slots.length > 0) {
              const parsed = slots.map((slot) => {
                const match = slot.match(/^(\S+)\s+([0-9:]+)-([0-9:]+)/);
                return {
                  day: match?.[1] || '',
                  timeFrom: match?.[2] || '',
                  timeTo: match?.[3] || '',
                };
              });
              setSchedules(parsed);
              setUseCustomDayTime(false);
            } else {
              // Use custom text mode
              setFormData(prev => ({ ...prev, customDayTime: club.dayTime }));
              setUseCustomDayTime(true);
            }
          }

          if (club.image) {
            setImagePreview(club.image);
            setExistingImageUrl(club.image);
            setRawImageUrl(club.image);
            setImageName('Aktuální obrázek');
            setImagePosition({
              x: club.imagePositionX ?? 50,
              y: club.imagePositionY ?? 50,
            });
          }
        } else {
          toast.error('Kroužek nebyl nalezen');
          router.push('/krouzky');
        }
        setIsLoadingClub(false);
      };

      loadClub();
    }
  }, [isAdmin, isEditMode, clubId, fetchClubById, userProfile?.uid, router]);

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

    if (name === 'price' || name === 'priceSemester' || name === 'priceYearly') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
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

  const parseTimeToMinutes = (timeValue: string): number => {
    const [hours, minutes] = timeValue.split(':').map((part) => Number(part));
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
    return hours * 60 + minutes;
  };

  const initializeSelection = (width: number, height: number) => {
    const maxWidth = Math.min(width, height * bannerAspect);
    const cropWidth = maxWidth;
    const cropHeight = cropWidth / bannerAspect;
    const maxX = Math.max(0, width - cropWidth);
    const maxY = Math.max(0, height - cropHeight);
    setSelection({
      x: maxX > 0 ? (imagePosition.x / 100) * maxX : (width - cropWidth) / 2,
      y: maxY > 0 ? (imagePosition.y / 100) * maxY : (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  const getImagePositionFromSelection = () => {
    if (!selection || !imageDimensions) {
      return { x: 50, y: 50 };
    }

    const maxX = Math.max(0, imageDimensions.width - selection.width);
    const maxY = Math.max(0, imageDimensions.height - selection.height);

    return {
      x: maxX > 0 ? (selection.x / maxX) * 100 : 50,
      y: maxY > 0 ? (selection.y / maxY) * 100 : 50,
    };
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
      setIsRecroppingExistingImage(false);
      setImagePosition({ x: 50, y: 50 });
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

  // Max output dimensions and target file size for optimization
  const MAX_BANNER_WIDTH = 1200;
  const MAX_BANNER_HEIGHT = 900;
  const TARGET_FILE_SIZE = 500 * 1024; // 500KB target

  const cropImageToFile = async (): Promise<File | null> => {
    try {
      if (!rawImageUrl || !selection) {
        toast.error('Chybí obrázek nebo výběr oblasti');
        return null;
      }

      const img = await loadImage(rawImageUrl);
      const imageWidth = img.naturalWidth || img.width;
      const imageHeight = img.naturalHeight || img.height;

      if (!imageWidth || !imageHeight) {
        toast.error('Nepodařilo se načíst rozměry obrázku');
        return null;
      }

      // Clamp selection to image bounds to prevent canvas IndexSizeError/DOMException.
      const sourceX = Math.max(0, Math.min(selection.x, imageWidth - 1));
      const sourceY = Math.max(0, Math.min(selection.y, imageHeight - 1));
      const sourceWidth = Math.max(1, Math.min(selection.width, imageWidth - sourceX));
      const sourceHeight = Math.max(1, Math.min(selection.height, imageHeight - sourceY));

      if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight)) {
        toast.error('Neplatný výběr oblasti pro ořez');
        return null;
      }

      // Calculate output dimensions - scale down if too large.
      let outputWidth = sourceWidth;
      let outputHeight = sourceHeight;

      if (outputWidth > MAX_BANNER_WIDTH || outputHeight > MAX_BANNER_HEIGHT) {
        const scaleW = MAX_BANNER_WIDTH / outputWidth;
        const scaleH = MAX_BANNER_HEIGHT / outputHeight;
        const scale = Math.min(scaleW, scaleH);
        outputWidth = Math.max(1, Math.round(outputWidth * scale));
        outputHeight = Math.max(1, Math.round(outputHeight * scale));
      }

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Nelze vytvořit canvas kontext');
        return null;
      }

      // Use better image smoothing for downscaling.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const fileName = rawImageFile?.name?.replace(/\.[^/.]+$/, '.jpg') || 'cropped-image.jpg';

      return await new Promise((resolve, reject) => {
        let quality = 0.85;

        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Nepodařilo se vytvořit výřez obrázku'));
              return;
            }

            // If file is too large and quality can be reduced, try again.
            if (blob.size > TARGET_FILE_SIZE && quality > 0.5) {
              quality -= 0.1;
              tryCompress();
              return;
            }

            const file = new File([blob], fileName, { type: 'image/jpeg' });
            resolve(file);
          }, 'image/jpeg', quality);
        };

        tryCompress();
      });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Crop error:', message, error);
      toast.error(`Nepodařilo se oříznout obrázek: ${message}`);
      return null;
    }
  };

  const handleApplyCrop = async () => {
    const file = await cropImageToFile();
    if (!file) return;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image: file }));
    setImagePosition({ x: 50, y: 50 });
    setIsRecroppingExistingImage(false);
    setImagePreview(previewUrl);
    setImageName(file.name);
    setIsCropDialogOpen(false);
  };

  const handleSaveCropOnly = async () => {
    if (!isEditMode || !clubId) {
      await handleApplyCrop();
      return;
    }

    if (isRecroppingExistingImage && existingImageUrl) {
      const nextImagePosition = getImagePositionFromSelection();
      const patch: Partial<Club> = {
        imagePositionX: nextImagePosition.x,
        imagePositionY: nextImagePosition.y,
      };
      const resubmissionMetadata = buildResubmissionMetadata(patch);

      setIsSavingCrop(true);
      try {
        const result = await updateClub(clubId, { ...patch, ...resubmissionMetadata });

        if (!result.success) {
          toast.error(result.error || 'Nepodařilo se uložit výřez');
          return;
        }

        if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(rawImageUrl);
        }

        setImagePosition(nextImagePosition);
        setImagePreview(existingImageUrl);
        setRawImageUrl(existingImageUrl);
        setIsCropDialogOpen(false);
        if ((resubmissionMetadata.status || '') === 'pending') {
          toast.success('Výřez uložen. Kroužek byl vrácen ke schválení.');
        } else {
          toast.success('Výřez obrázku byl uložen');
        }
      } catch (error) {
        console.error('Crop save error:', error);
        toast.error('Nepodařilo se uložit výřez');
      } finally {
        setIsSavingCrop(false);
      }
      return;
    }

    const file = await cropImageToFile();
    if (!file) return;

    setIsSavingCrop(true);
    try {
      const imageUrl = await uploadClubImage(file, clubId);
      if (!imageUrl) {
        toast.error('Nepodařilo se nahrát oříznutý obrázek');
        return;
      }

      const patch: Partial<Club> = { image: imageUrl };
      const resubmissionMetadata = buildResubmissionMetadata(patch);
      const result = await updateClub(clubId, { ...patch, ...resubmissionMetadata });
      if (!result.success) {
        toast.error(result.error || 'Nepodařilo se uložit výřez');
        return;
      }

      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setImagePosition({ x: 50, y: 50 });
      setImagePreview(imageUrl);
      setExistingImageUrl(imageUrl);
      setRawImageUrl(imageUrl);
      setImageName(file.name);
      setIsCropDialogOpen(false);
      if ((resubmissionMetadata.status || '') === 'pending') {
        toast.success('Výřez uložen. Kroužek byl vrácen ke schválení.');
      } else {
        toast.success('Výřez obrázku byl uložen');
      }
    } catch (error) {
      console.error('Crop save error:', error);
      toast.error('Nepodařilo se uložit výřez');
    } finally {
      setIsSavingCrop(false);
    }
  };

  const [isLoadingCrop, setIsLoadingCrop] = useState(false);

  const handleRecropExisting = async () => {
    // Prefer blob URL for robust image loading, but gracefully fall back to direct URL.
    const existingUrl = imagePreview || rawImageUrl;
    if (!existingUrl) return;

    setIsLoadingCrop(true);
    try {
      if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawImageUrl);
      }

      if (existingUrl.startsWith('blob:')) {
        setRawImageUrl(existingUrl);
        setRawImageFile(null);
      } else {
        try {
          const response = await fetch(existingUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const blob = await response.blob();
          const file = new File([blob], 'existing-image.jpg', { type: blob.type || 'image/jpeg' });
          const blobUrl = URL.createObjectURL(blob);
          setRawImageUrl(blobUrl);
          setRawImageFile(file);
        } catch (fetchError) {
          console.warn('Recrop fetch fallback to direct URL:', fetchError);
          // Fallback still allows manual crop-position update for existing image.
          setRawImageUrl(existingUrl);
          setRawImageFile(null);
        }
      }

      setIsRecroppingExistingImage(true);
      setImageDimensions(null);
      setSelection(null);
      setIsCropDialogOpen(true);
    } catch (err) {
      console.error('Error loading image for crop:', err);
      toast.error('Nepodařilo se načíst obrázek pro ořez');
    } finally {
      setIsLoadingCrop(false);
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

  const handleTouchDragStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!selection || !imageWrapperRef.current || !imageDimensions) return;
    const touch = event.touches[0];
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    const pointerX = (touch.clientX - rect.left) * scaleX;
    const pointerY = (touch.clientY - rect.top) * scaleY;
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

  const handleTouchDragMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.preventDefault();
    event.stopPropagation();
    if (!selection || !imageWrapperRef.current || !imageDimensions) return;
    const touch = event.touches[0];
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    const targetX = (touch.clientX - rect.left) * scaleX - dragOffset.x;
    const targetY = (touch.clientY - rect.top) * scaleY - dragOffset.y;
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
  const isSlotTimeOrderInvalid = (slot: { timeFrom: string; timeTo: string }) => {
    if (!slot.timeFrom || !slot.timeTo) return false;
    const fromMinutes = parseTimeToMinutes(slot.timeFrom);
    const toMinutes = parseTimeToMinutes(slot.timeTo);
    return !Number.isFinite(fromMinutes) || !Number.isFinite(toMinutes) || fromMinutes >= toMinutes;
  };
  const hasScheduleTimeOrderInvalid = !useCustomDayTime && schedules.some((slot) => isSlotTimeOrderInvalid(slot));
  
  const isAgeFromInvalid = formData.ageFrom && (isNaN(ageFromNumber) || ageFromNumber < 0 || ageFromNumber > 99);
  const isAgeToInvalid = formData.ageTo && (isNaN(ageToNumber) || ageToNumber < 0 || ageToNumber > 99);
  const capacityNumber = parseInt(formData.capacity, 10);
  const isCapacityInvalid = formData.capacity && (isNaN(capacityNumber) || capacityNumber < 0 || capacityNumber > 99);
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

    // Ensure Firebase Auth is available and user is authenticated
    if (!auth || !auth.currentUser) {
      toast.error('Autentizace selhala. Prosím přihlaste se znovu.');
      return;
    }

    const hasLegacyPrice = !!formData.price;
    const hasSemesterPrice = !!formData.priceSemester;
    const hasYearlyPrice = !!formData.priceYearly;

    if (!hasLegacyPrice && !hasSemesterPrice && !hasYearlyPrice) {
      toast.error('Vyplňte alespoň jednu cenu');
      return;
    }

    const ageFrom = parseInt(formData.ageFrom) || 0;
    const ageTo = parseInt(formData.ageTo) || 0;
    if (ageFrom >= ageTo) {
      toast.error('Věk "Od" musí být menší než "Do"');
      return;
    }

    // Validation for day/time based on mode
    if (useCustomDayTime) {
      if (!formData.customDayTime.trim()) {
        toast.error('Vyplňte čas konání kroužku');
        return;
      }
    } else {
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

      const hasInvalidTimeRange = completeSchedules.some((slot) => {
        const fromMinutes = parseTimeToMinutes(slot.timeFrom);
        const toMinutes = parseTimeToMinutes(slot.timeTo);
        return !Number.isFinite(fromMinutes) || !Number.isFinite(toMinutes) || fromMinutes >= toMinutes;
      });
      if (hasInvalidTimeRange) {
        toast.error('Čas "Od" musí být menší než "Do"');
        return;
      }

      if (!completeSchedules.length) {
        toast.error('Vyplňte alespoň jeden čas konání kroužku');
        return;
      }
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
          console.error('Crop error:', getErrorMessage(cropError), cropError);
          toast.error('Nepodařilo se oříznout obrázek. Zkuste to prosím znovu.');
        }
      }

      const dayTime = useCustomDayTime 
        ? formData.customDayTime
        : schedules
            .filter((slot) => slot.day && slot.timeFrom && slot.timeTo)
            .map((slot) => `${slot.day} ${slot.timeFrom}-${slot.timeTo}`)
            .join('; ');

      const parsedLegacyPrice = formData.price ? parseInt(formData.price, 10) : undefined;
      const parsedSemesterPrice = formData.priceSemester ? parseInt(formData.priceSemester, 10) : undefined;
      const parsedYearlyPrice = formData.priceYearly ? parseInt(formData.priceYearly, 10) : undefined;

      const fallbackPrice = parsedLegacyPrice ?? parsedYearlyPrice ?? parsedSemesterPrice ?? 0;
      const fallbackPeriod = formData.pricePeriod || (parsedYearlyPrice ? 'yearly' : parsedSemesterPrice ? 'semester' : '');
      const parsedCapacity = parseInt(formData.capacity, 10);
      const availabilityNote = formData.availabilityNote.trim();
      
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
        capacity: Number.isNaN(parsedCapacity) ? 0 : parsedCapacity,
        ...(availabilityNote ? { availabilityNote } : {}),
        price: fallbackPrice,
        pricePeriod: fallbackPeriod,
        ownerClaimed: !isAdmin,
        ...(parsedSemesterPrice !== undefined ? { priceSemester: parsedSemesterPrice } : {}),
        ...(parsedYearlyPrice !== undefined ? { priceYearly: parsedYearlyPrice } : {}),
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

        const resubmissionMetadata = buildResubmissionMetadata(clubData as Partial<Club>);
        
        const result = await updateClub(clubId, { ...(clubData as Partial<Club>), ...resubmissionMetadata });
        if (result.success) {
          if ((resubmissionMetadata.status || '') === 'pending') {
            toast.success('Kroužek byl upraven a vrácen ke schválení administrátorem.');
          } else {
            toast.success('Kroužek byl úspěšně aktualizován!');
          }
          setTimeout(() => router.push(`/krouzky/${clubId}`), 1500);
        } else {
          toast.error(result.error || 'Chyba při aktualizaci kroužku');
        }
      } else {
        // Create new club - use Firebase Auth UID directly
        const result = await createClub(clubData, auth.currentUser.uid);
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

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label>Čas konání *</Label>
                      <p className="text-xs text-muted-foreground">
                        {useCustomDayTime 
                          ? 'Popište vlastními slovy, kdy kroužek probíhá' 
                          : 'Zadejte časy, kdy kroužek probíhá'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUseCustomDayTime(!useCustomDayTime)}
                    >
                      {useCustomDayTime ? 'Použít strukturované časy' : 'Použít vlastní text'}
                    </Button>
                  </div>

                  {useCustomDayTime ? (
                    <Textarea
                      id="customDayTime"
                      name="customDayTime"
                      placeholder="Např: Pondělí a středa od 16:00 do 17:30, víkendové kempy dle dohody"
                      value={formData.customDayTime}
                      onChange={handleInputChange}
                      maxLength={500}
                      required
                      rows={3}
                    />
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((slot, index) => (
                        <div key={index} className="space-y-1">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                            <div className="min-w-0">
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
                            <div className="min-w-0">
                              <Label htmlFor={`timeFrom-${index}`}>Čas od</Label>
                              <Input
                                id={`timeFrom-${index}`}
                                type="time"
                                value={slot.timeFrom}
                                onChange={(e) => handleScheduleChange(index, 'timeFrom', e.target.value)}
                                max={slot.timeTo || undefined}
                                className={`w-full ${isSlotTimeOrderInvalid(slot) ? 'border-red-500' : ''}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <Label htmlFor={`timeTo-${index}`}>Čas do</Label>
                              <Input
                                id={`timeTo-${index}`}
                                type="time"
                                value={slot.timeTo}
                                onChange={(e) => handleScheduleChange(index, 'timeTo', e.target.value)}
                                min={slot.timeFrom || undefined}
                                className={`w-full ${isSlotTimeOrderInvalid(slot) ? 'border-red-500' : ''}`}
                              />
                            </div>
                            <div className="flex gap-2">
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
                          {isSlotTimeOrderInvalid(slot) && (
                            <p className="text-xs text-red-600">Čas "Od" musí být menší než "Do"</p>
                          )}
                        </div>
                      ))}
                      {hasScheduleTimeOrderInvalid && (
                        <p className="text-sm text-red-600 font-medium">⚠ Opravte časové rozmezí: "Od" musí být menší než "Do"</p>
                      )}
                      <Button type="button" variant="secondary" onClick={handleAddSchedule}>
                        + Přidat další čas
                      </Button>
                    </div>
                  )}
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
                            style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-600">✓ Obrázek připraven</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleRecropExisting();
                            }}
                            disabled={isLoadingCrop}
                          >
                            <Crop className="h-4 w-4 mr-2" />
                            {isLoadingCrop ? 'Načítání...' : 'Upravit ořez'}
                          </Button>
                        </div>
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
                    className="relative w-full max-h-[60vh] overflow-hidden rounded-lg bg-black/5 mb-4 touch-none"
                    onMouseLeave={handleDragEnd}
                    onMouseUp={handleDragEnd}
                    onMouseMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    onTouchCancel={handleDragEnd}
                    onTouchMove={handleTouchDragMove}
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
                            className="absolute border-4 border-white shadow-xl cursor-move touch-none"
                            style={{
                              left: `${(selection.x / imageDimensions.width) * 100}%`,
                              top: `${(selection.y / imageDimensions.height) * 100}%`,
                              width: `${(selection.width / imageDimensions.width) * 100}%`,
                              height: `${(selection.height / imageDimensions.height) * 100}%`,
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                            }}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleTouchDragStart}
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
                      onClick={() => void handleSaveCropOnly()}
                      disabled={!selection || !rawImageUrl || isSavingCrop}
                    >
                      {isSavingCrop ? 'Ukládání...' : isEditMode ? 'Uložit výřez' : 'Potvrdit výřez'}
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
                  <Label htmlFor="address">Adresa / Místo konání {isContactInfoOptional ? '' : '*'}</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Ulice, město"
                    value={formData.address}
                    onChange={handleInputChange}
                    maxLength={200}
                    required={!isContactInfoOptional}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.address.length}/200
                  </div>
                </div>

                <div>
                  <Label htmlFor="trainerName">Jméno trenéra/vedoucího {isContactInfoOptional ? '' : '*'}</Label>
                  <Input
                    id="trainerName"
                    name="trainerName"
                    placeholder="Váše jméno"
                    value={formData.trainerName}
                    onChange={handleInputChange}
                    maxLength={100}
                    required={!isContactInfoOptional}
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {formData.trainerName.length}/100
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trainerEmail">E-mail {isContactInfoOptional ? '' : '*'}</Label>
                    <Input
                      id="trainerEmail"
                      name="trainerEmail"
                      type="email"
                      placeholder="vase@email.cz"
                      value={formData.trainerEmail}
                      onChange={handleInputChange}
                      maxLength={120}
                      required={!isContactInfoOptional}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <Label htmlFor="capacity">Volná místa *</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      inputMode="numeric"
                      placeholder="20"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="0"
                      max="99"
                      maxLength={2}
                      required
                      className={isCapacityInvalid ? 'border-red-500' : ''}
                    />
                    {isCapacityInvalid && (
                      <p className="text-xs text-red-600 mt-1">Zadejte číslo 0–99</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Label htmlFor="availabilityNote">Poznámka k volným místům (volitelné)</Label>
                    <Input
                      id="availabilityNote"
                      name="availabilityNote"
                      type="text"
                      placeholder="Např. Bereme náhradníky"
                      value={formData.availabilityNote}
                      onChange={handleInputChange}
                      maxLength={80}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tato poznámka se zobrazí u volných míst místo automatického textu.
                    </p>
                  </div>
                </div>

                {isAgeOrderInvalid && (
                  <p className="text-sm text-red-600 font-medium">⚠ Věk "Od" musí být menší než "Do"</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Základní cena (Kč)</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePeriod">Frekvence základní ceny</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceSemester">Cena za pololetí (Kč)</Label>
                    <Input
                      id="priceSemester"
                      name="priceSemester"
                      type="number"
                      placeholder="3000"
                      value={formData.priceSemester}
                      onChange={handleInputChange}
                      min="0"
                      max="999999"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceYearly">Cena za celý rok (Kč)</Label>
                    <Input
                      id="priceYearly"
                      name="priceYearly"
                      type="number"
                      placeholder="5500"
                      value={formData.priceYearly}
                      onChange={handleInputChange}
                      min="0"
                      max="999999"
                      maxLength={6}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stačí vyplnit jednu cenu. Ostatní pole jsou volitelná.
                </p>

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
              <Button type="submit" disabled={isLoading || isAgeOrderInvalid || hasScheduleTimeOrderInvalid}>
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
