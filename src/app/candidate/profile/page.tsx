"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getLocaleFromPath, getTranslations } from "@/lib/i18n";
import { useLoading } from "@/components/common/loading-overlay";

interface EducationItem {
  id: string;
  qualification: string;
  institution: string;
  specialization?: string | null;
  startYear: number;
  completionYear: number;
  gradeOrPercentage?: string | null;
}

interface ExperienceItem {
  id: string;
  organization: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

interface ProfileData {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  alternativePhone?: string | null;
  bio?: string | null;
  completionPercentage: number;
  isSubmitted: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string | null;
  };
  address?: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    district?: string | null;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  educations: EducationItem[];
  experiences: ExperienceItem[];
}

export default function CandidateProfilePage() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const isHindi = locale === "hi";
  const { t } = getTranslations(locale);
  const { withLoading } = useLoading();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  // Step 1: Personal
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("PREFER_NOT_TO_SAY");
  const [alternativePhone, setAlternativePhone] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Step 3: Education Modal/Form
  const [eduQual, setEduQual] = useState("");
  const [eduInst, setEduInst] = useState("");
  const [eduSpec, setEduSpec] = useState("");
  const [eduStart, setEduStart] = useState<number>(2020);
  const [eduEnd, setEduEnd] = useState<number>(2024);
  const [eduGrade, setEduGrade] = useState("");

  // Step 4: Experience Form
  const [expOrg, setExpOrg] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expType, setExpType] = useState("Full-time");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/candidate/profile");
      const json = await res.json();
      if (json.success && json.data) {
        const p: ProfileData = json.data;
        setProfile(p);
        setFullName(p.user?.fullName || "");
        setPhoneNumber(p.user?.phoneNumber || "");
        setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "");
        setGender(p.gender || "PREFER_NOT_TO_SAY");
        setAlternativePhone(p.alternativePhone || "");
        setBio(p.bio || "");

        if (p.address) {
          setAddressLine1(p.address.addressLine1 || "");
          setAddressLine2(p.address.addressLine2 || "");
          setCity(p.address.city || "");
          setDistrict(p.address.district || "");
          setState(p.address.state || "");
          setPostalCode(p.address.postalCode || "");
        }
      }
    } catch {
      setFeedback({ text: "Failed to load candidate profile", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/profile/personal", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            phoneNumber: phoneNumber || null,
            dateOfBirth: dateOfBirth || null,
            gender,
            alternativePhone: alternativePhone || null,
            bio: bio || null,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setFeedback({ text: isHindi ? "व्यक्तिगत जानकारी सहेजी गई" : "Personal information saved successfully", type: "success" });
          setActiveStep(2);
        } else {
          setFeedback({ text: json.error?.message || "Failed to save personal info", type: "error" });
        }
      } catch {
        setFeedback({ text: "Error saving personal info", type: "error" });
      }
    }, isHindi ? "सहेजा जा रहा है..." : "Saving personal details...");
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/profile/address", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addressLine1,
            addressLine2: addressLine2 || null,
            city,
            district: district || null,
            state,
            postalCode,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setFeedback({ text: isHindi ? "पता विवरण सहेजा गया" : "Address details saved successfully", type: "success" });
          setActiveStep(3);
        } else {
          setFeedback({ text: json.error?.message || "Failed to save address", type: "error" });
        }
      } catch {
        setFeedback({ text: "Error saving address", type: "error" });
      }
    }, isHindi ? "पता सहेजा जा रहा है..." : "Saving address details...");
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/profile/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qualification: eduQual,
            institution: eduInst,
            specialization: eduSpec || null,
            startYear: Number(eduStart),
            completionYear: Number(eduEnd),
            gradeOrPercentage: eduGrade || null,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setEduQual("");
          setEduInst("");
          setEduSpec("");
          setEduGrade("");
          setFeedback({ text: isHindi ? "शिक्षा विवरण जोड़ा गया" : "Education record added", type: "success" });
        } else {
          setFeedback({ text: json.error?.message || "Failed to add education", type: "error" });
        }
      } catch {
        setFeedback({ text: "Error adding education", type: "error" });
      }
    }, isHindi ? "शिक्षा जोड़ी जा रही है..." : "Adding education record...");
  };

  const handleDeleteEducation = async (eduId: string) => {
    await withLoading(async () => {
      try {
        const res = await fetch(`/api/candidate/profile/education/${eduId}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
        }
      } catch {
        setFeedback({ text: "Failed to remove education", type: "error" });
      }
    }, isHindi ? "हटाया जा रहा है..." : "Removing education...");
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/profile/experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization: expOrg,
            jobTitle: expTitle,
            employmentType: expType,
            startDate: expStart,
            endDate: expIsCurrent ? null : expEnd || null,
            isCurrent: expIsCurrent,
            description: expDesc || null,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setExpOrg("");
          setExpTitle("");
          setExpDesc("");
          setFeedback({ text: isHindi ? "अनुभव विवरण जोड़ा गया" : "Experience record added", type: "success" });
        } else {
          setFeedback({ text: json.error?.message || "Failed to add experience", type: "error" });
        }
      } catch {
        setFeedback({ text: "Error adding experience", type: "error" });
      }
    }, isHindi ? "अनुभव जोड़ा जा रहा है..." : "Adding experience...");
  };

  const handleDeleteExperience = async (expId: string) => {
    await withLoading(async () => {
      try {
        const res = await fetch(`/api/candidate/profile/experience/${expId}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
        }
      } catch {
        setFeedback({ text: "Failed to remove experience", type: "error" });
      }
    }, isHindi ? "हटाया जा रहा है..." : "Removing experience...");
  };

  const handleSubmitProfile = async () => {
    await withLoading(async () => {
      try {
        const res = await fetch("/api/candidate/profile/submit", { method: "POST" });
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setFeedback({ text: isHindi ? "प्रोफ़ाइल सफलतापूर्वक सबमिट की गई!" : "Profile successfully finalized and submitted!", type: "success" });
        }
      } catch {
        setFeedback({ text: "Failed to finalize profile", type: "error" });
      }
    }, isHindi ? "प्रोफ़ाइल सबमिट की जा रही है..." : "Finalizing profile...");
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">{isHindi ? "प्रोफ़ाइल लोड हो रही है..." : "Loading candidate profile..."}</p>
      </div>
    );
  }

  const steps = [
    { num: 1, label: isHindi ? "व्यक्तिगत विवरण" : "Personal", icon: User },
    { num: 2, label: isHindi ? "पता" : "Address", icon: MapPin },
    { num: 3, label: isHindi ? "शिक्षा" : "Education", icon: GraduationCap },
    { num: 4, label: isHindi ? "अनुभव" : "Experience", icon: Briefcase },
    { num: 5, label: isHindi ? "समीक्षा" : "Review", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 md:p-8 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold">
              <User className="h-3.5 w-3.5" />
              {isHindi ? "अभ्यर्थी प्रोफ़ाइल ऑनबोर्डिंग" : "Candidate Profile & Onboarding"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {profile?.user?.fullName || "Candidate Profile"}
            </h1>
            <p className="text-sm text-blue-100/90 max-w-xl">
              {isHindi
                ? "आधिकारिक परीक्षा पंजीकरण, सत्यापन और व्यक्तिगत विश्लेषण के लिए अपना प्रोफ़ाइल विवरण पूर्ण करें।"
                : "Manage personal information, address verification, education history, and clinical experience."}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              {isHindi ? "प्रोफ़ाइल पूर्णता" : "Profile Completion"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black">{profile?.completionPercentage || 20}%</span>
              {profile?.isSubmitted && (
                <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold">
                  ✓ {isHindi ? "सबमिट किया गया" : "Submitted"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-sm font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Step Navigation Bar */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {steps.map((s) => {
          const Icon = s.icon;
          const isCurrent = s.num === activeStep;
          const isPast = s.num < activeStep;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-xs"
                  : isPast
                  ? "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Personal Details */}
      {activeStep === 1 && (
        <Card className="shadow-xs border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {isHindi ? "1. व्यक्तिगत जानकारी" : "1. Personal Information"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isHindi ? "मूल नाम, संपर्क नंबर और जन्म तिथि" : "Basic candidate identification and contact details"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSavePersonal}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="fullName"
                  label={t("auth.fullName")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  id="emailReadonly"
                  label={t("auth.email")}
                  value={profile?.user?.email || ""}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  id="phoneNumber"
                  label={isHindi ? "प्राथमिक फोन" : "Primary Phone"}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                />
                <Input
                  id="altPhone"
                  label={isHindi ? "वैकल्पिक फोन" : "Alternative Phone"}
                  value={alternativePhone}
                  onChange={(e) => setAlternativePhone(e.target.value)}
                  placeholder="+91 ..."
                />
                <Input
                  id="dob"
                  type="date"
                  label={isHindi ? "जन्म तिथि (DOB)" : "Date of Birth"}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isHindi ? "लिंग (Gender)" : "Gender"}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                  >
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isHindi ? "संक्षिप्त परिचय (Bio / Remarks)" : "Brief Bio / Target Exam Goal"}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Aiming for UP Health Officer 2026 examination..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                  />
                </div>
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" className="font-semibold text-xs min-h-[40px]">
                <Save className="h-4 w-4 mr-1.5" />
                {isHindi ? "सहेजें एवं आगे बढ़ें" : "Save & Proceed to Address"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 2: Address */}
      {activeStep === 2 && (
        <Card className="shadow-xs border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              {isHindi ? "2. स्थायी / वर्तमान पता" : "2. Permanent / Correspondence Address"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isHindi ? "राज्य, जिला, शहर और पिन कोड" : "Residential location and communication address"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveAddress}>
            <CardContent className="space-y-4">
              <Input
                id="addr1"
                label={isHindi ? "पता पंक्ति 1 (मकान/गली)" : "Address Line 1"}
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House / Flat / Street Name"
                required
              />

              <Input
                id="addr2"
                label={isHindi ? "पता पंक्ति 2 (ऐच्छिक)" : "Address Line 2 (Optional)"}
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Landmark / Area"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  id="city"
                  label={isHindi ? "शहर / गाँव" : "City / Town"}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  id="district"
                  label={isHindi ? "जिला" : "District"}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
                <Input
                  id="state"
                  label={isHindi ? "राज्य" : "State"}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Uttar Pradesh"
                  required
                />
                <Input
                  id="pincode"
                  label={isHindi ? "पिन कोड" : "Postal / PIN Code"}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="201301"
                  required
                />
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(1)} className="text-xs font-semibold">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="submit" className="font-semibold text-xs min-h-[40px]">
                <Save className="h-4 w-4 mr-1.5" />
                {isHindi ? "सहेजें एवं आगे बढ़ें" : "Save & Proceed to Education"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 3: Education */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                {isHindi ? "3. शैक्षणिक योग्यता (Education History)" : "3. Academic Qualifications"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isHindi ? "नर्सिंग, स्नातक, 12वीं या अन्य योग्यताएं जोड़ें" : "Add degree, diploma, nursing qualification, and schooling"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form to Add Education */}
              <form onSubmit={handleAddEducation} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-blue-600" />
                  {isHindi ? "नई योग्यता जोड़ें" : "Add Qualification"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    id="eduQual"
                    label={isHindi ? "योग्यता (जैसे B.Sc Nursing, GNM)" : "Qualification / Degree"}
                    value={eduQual}
                    onChange={(e) => setEduQual(e.target.value)}
                    placeholder="B.Sc Nursing"
                    required
                  />
                  <Input
                    id="eduInst"
                    label={isHindi ? "संस्थान / विश्वविद्यालय" : "Institution / Board"}
                    value={eduInst}
                    onChange={(e) => setEduInst(e.target.value)}
                    placeholder="King George's Medical University"
                    required
                  />
                  <Input
                    id="eduSpec"
                    label={isHindi ? "विशेषज्ञता (Optional)" : "Specialization"}
                    value={eduSpec}
                    onChange={(e) => setEduSpec(e.target.value)}
                    placeholder="Community Health"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    id="eduStart"
                    type="number"
                    label={isHindi ? "प्रारंभ वर्ष" : "Start Year"}
                    value={eduStart}
                    onChange={(e) => setEduStart(Number(e.target.value))}
                    required
                  />
                  <Input
                    id="eduEnd"
                    type="number"
                    label={isHindi ? "समाप्ति वर्ष" : "Completion Year"}
                    value={eduEnd}
                    onChange={(e) => setEduEnd(Number(e.target.value))}
                    required
                  />
                  <Input
                    id="eduGrade"
                    label={isHindi ? "अंक / प्रतिशत (Grade/%)" : "Grade / Percentage"}
                    value={eduGrade}
                    onChange={(e) => setEduGrade(e.target.value)}
                    placeholder="78.5%"
                  />
                </div>
                <Button type="submit" size="sm" className="font-semibold text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {isHindi ? "योग्यता जोड़ें" : "Add Education"}
                </Button>
              </form>

              {/* Education List */}
              {profile?.educations && profile.educations.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.educations.map((edu) => (
                    <div key={edu.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{edu.qualification}</p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {edu.institution} {edu.specialization ? `• ${edu.specialization}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {edu.startYear} – {edu.completionYear} {edu.gradeOrPercentage ? `(${edu.gradeOrPercentage})` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="h-7 px-2.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  {isHindi ? "अभी तक कोई शैक्षणिक योग्यता नहीं जोड़ी गई है।" : "No education records added yet."}
                </div>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(2)} className="text-xs font-semibold">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={() => setActiveStep(4)} className="font-semibold text-xs min-h-[40px]">
                {isHindi ? "आगे बढ़ें (अनुभव)" : "Proceed to Experience"} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 4: Experience */}
      {activeStep === 4 && (
        <div className="space-y-6">
          <Card className="shadow-xs border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                {isHindi ? "4. कार्यानुभव (Experience History)" : "4. Clinical & Work Experience"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isHindi ? "अस्पताल, स्वास्थ्य केंद्र या क्लीनिकल अनुभव जोड़ें" : "Hospital, health center, internship, or professional service"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form to Add Experience */}
              <form onSubmit={handleAddExperience} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-blue-600" />
                  {isHindi ? "नया अनुभव जोड़ें" : "Add Work Experience"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    id="expOrg"
                    label={isHindi ? "संस्था / अस्पताल" : "Organization / Hospital"}
                    value={expOrg}
                    onChange={(e) => setExpOrg(e.target.value)}
                    placeholder="District Hospital, Lucknow"
                    required
                  />
                  <Input
                    id="expTitle"
                    label={isHindi ? "पद नाम (Job Title)" : "Job Title"}
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="Staff Nurse / Clinical Officer"
                    required
                  />
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      {isHindi ? "प्रकार" : "Employment Type"}
                    </label>
                    <select
                      value={expType}
                      onChange={(e) => setExpType(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contractual">Contractual / NHM</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="expStart"
                    type="date"
                    label={isHindi ? "प्रारंभ तिथि" : "Start Date"}
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    required
                  />
                  {!expIsCurrent && (
                    <Input
                      id="expEnd"
                      type="date"
                      label={isHindi ? "समाप्ति तिथि" : "End Date"}
                      value={expEnd}
                      onChange={(e) => setExpEnd(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="expCurrentCheck"
                    checked={expIsCurrent}
                    onChange={(e) => setExpIsCurrent(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="expCurrentCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isHindi ? "वर्तमान में यहाँ कार्यरत हूँ" : "Currently working in this role"}
                  </label>
                </div>
                <Button type="submit" size="sm" className="font-semibold text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {isHindi ? "अनुभव जोड़ें" : "Add Experience"}
                </Button>
              </form>

              {/* Experience List */}
              {profile?.experiences && profile.experiences.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{exp.jobTitle}</p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {exp.organization} • <span className="font-medium">{exp.employmentType}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {new Date(exp.startDate).toLocaleDateString()} – {exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="h-7 px-2.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  {isHindi ? "अभी तक कोई कार्यानुभव नहीं जोड़ा गया है।" : "No experience records added yet (Optional)."}
                </div>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(3)} className="text-xs font-semibold">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={() => setActiveStep(5)} className="font-semibold text-xs min-h-[40px]">
                {isHindi ? "समीक्षा एवं सबमिट" : "Proceed to Review"} <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 5: Review & Final Submission */}
      {activeStep === 5 && (
        <Card className="shadow-xs border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {isHindi ? "5. प्रोफ़ाइल समीक्षा एवं पुष्टि" : "5. Profile Review & Finalize"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isHindi ? "कृपया सबमिट करने से पहले अपने सभी विवरणों की समीक्षा करें" : "Review your completed profile before final submission"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  {isHindi ? "व्यक्तिगत एवं संपर्क" : "Personal & Contact"}
                </h4>
                <p><strong>{isHindi ? "नाम:" : "Name:"}</strong> {profile?.user?.fullName}</p>
                <p><strong>{isHindi ? "ईमेल:" : "Email:"}</strong> {profile?.user?.email}</p>
                <p><strong>{isHindi ? "फोन:" : "Phone:"}</strong> {profile?.user?.phoneNumber || "—"}</p>
                <p><strong>{isHindi ? "लिंग:" : "Gender:"}</strong> {profile?.gender || "—"}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  {isHindi ? "पता" : "Address"}
                </h4>
                {profile?.address ? (
                  <>
                    <p>{profile.address.addressLine1}</p>
                    <p>{profile.address.city}, {profile.address.state} - {profile.address.postalCode}</p>
                  </>
                ) : (
                  <p className="text-slate-400">{isHindi ? "पता उपलब्ध नहीं है" : "No address specified"}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900 dark:text-blue-200 text-xs">
                  {isHindi ? "प्रोफ़ाइल पूर्णता स्कोर: " : "Calculated Profile Completion: "}
                  <span className="text-blue-700 dark:text-blue-300 font-extrabold">{profile?.completionPercentage}%</span>
                </p>
                <p className="text-[11px] text-blue-800 dark:text-blue-400 mt-0.5">
                  {isHindi
                    ? "आप बाद में कभी भी अपनी शैक्षणिक योग्यता या अनुभव को अपडेट कर सकते हैं।"
                    : "You can update or add new education and experience records at any time."}
                </p>
              </div>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(4)} className="text-xs font-semibold">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmitProfile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[40px]"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isHindi ? "प्रोफ़ाइल अंतिम रूप से सबमिट करें" : "Finalize & Submit Profile"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
