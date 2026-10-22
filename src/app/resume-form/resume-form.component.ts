import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AtsAnalysisResult,
  calculateAtsAnalysis,
  extractJdKeywords,
} from './ats-optimizer';
import { AISWARYA_PHOTO_BASE64 } from './photo-base64';
import { pincodeValidator } from './pincode.validator';

@Component({
  selector: 'app-resume-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './resume-form.component.html',
  styleUrl: './resume-form.component.css',
})
export class ResumeFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Main Reactive Form Group
  resumeForm!: FormGroup;

  // View state: 'form' | 'preview' | 'ats'
  activeView: 'form' | 'preview' | 'ats' = 'form';

  // Language options
  readonly availableLanguages: string[] = [
    'English',
    'Hindi',
    'Malayalam',
    'Tamil',
    'Others',
  ];

  // Gender options
  readonly genderOptions: string[] = ['Male', 'Female', 'Other'];

  // State flags for optional sections
  showExperience: boolean = false;
  showProjects: boolean = false;
  showEducation: boolean = false;
  showCertifications: boolean = false;
  showAchievements: boolean = false;
  showReferences: boolean = false;
  showSkillsSection: boolean = true;

  // Candidate Picture preview
  candidatePicturePreview: string | null = AISWARYA_PHOTO_BASE64;

  // Submission state
  isSubmitted: boolean = false;
  showSuccessMessage: boolean = false;
  submittedResumeData: any = null;

  // ATS Optimization
  jobDescription: string = '';
  atsResult: AtsAnalysisResult | null = null;
  optimizationMessage: string | null = null;

  // Pre-configured Job Descriptions for 1-click ATS testing
  readonly sampleJdPresets = [
    {
      label: 'Full Stack Python & React Developer',
      role: 'Full Stack Developer',
      text: `We are looking for a Full Stack Developer proficient in Python, React, JavaScript, HTML, CSS, and SQL.
The ideal candidate will have hands-on experience building REST APIs with Flask or Django, working with Git, GitHub, Docker, and Postman.
Requirements:
- Strong problem-solving skills, analytical thinking, and team collaboration.
- Understanding of OOPs, Data Structures, Algorithms, and responsive web development.
- Experience with databases like MySQL, PostgreSQL, or MongoDB.
- Ability to design clean UI components and maintain scalable backend services.`,
    },
    {
      label: 'Python Backend Engineer',
      role: 'Backend Engineer',
      text: `Seeking a Backend Python Engineer to develop scalable microservices, manage databases (SQL, Redis, MongoDB), and integrate third-party REST APIs.
Knowledge of Cloud computing (AWS/GCP), CI/CD pipelines, Docker, Postman, and unit testing is highly preferred.
Must have excellent communication, adaptability, and performance optimization skills.`,
    },
    {
      label: 'Frontend React & Angular Developer',
      role: 'Frontend Developer',
      text: `Hiring a Frontend Web Developer skilled in React, TypeScript, JavaScript, CSS, HTML, and REST APIs.
Responsibilities include building dynamic single-page web applications, managing state, optimizing accessibility, and collaborating with cross-functional teams using Agile methodology and Git.`,
    },
  ];

  ngOnInit(): void {
    this.initForm();
    // Default autofill with Aiswarya Manoj template
    this.fillSampleData();
    this.runAtsAnalysis();
  }

  /**
   * Initializes the reactive form structure matching all requirements
   */
  private initForm(): void {
    const languageControls: { [key: string]: any } = {};
    this.availableLanguages.forEach((lang) => {
      languageControls[lang] = [false];
    });

    this.resumeForm = this.fb.group({
      // Candidate Picture
      candidatePicture: [AISWARYA_PHOTO_BASE64],

      // Personal Details
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(1)]],
      dob: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      github: ['github.com/aiswaryamanoj'],
      linkedin: ['linkedin.com/in/aiswaryamanoj'],
      portfolio: ['Portfolio'],
      gender: ['', [Validators.required]],

      // Career Objective
      objective: [
        'Computer Science Engineering graduate with knowledge of Python, web development, SQL, and software development, with a keen interest in building scalable and user-friendly web applications. Eager to apply programming and problem-solving skills to develop reliable full-stack solutions using Python and continuously learn and adapt to new technologies.',
      ],

      // Categorized Skills
      skills: this.fb.group({
        programmingLanguages: ['Python, JavaScript, HTML, CSS'],
        frameworks: ['Flask, React'],
        databases: ['SQL, MySQL, MongoDB'],
        tools: ['Git, GitHub, VS Code, Postman'],
        concepts: ['OOPs, Data Structures, Algorithms, REST APIs, Web Development'],
        softSkills: ['Problem Solving, Analytical Thinking, Communication, Team Collaboration, Adaptability, Time Management'],
      }),

      // Languages Spoken (FormGroup of checkboxes)
      languages: this.fb.group(languageControls),

      // Address Form Group (House No, Street, City, State, Pincode with 6-digit validator)
      address: this.fb.group({
        houseNo: ['', [Validators.required]],
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        pincode: ['', [Validators.required, pincodeValidator()]],
      }),

      // Dynamic FormArrays
      experience: this.fb.array([]),
      projects: this.fb.array([]),
      education: this.fb.array([]),
      certifications: this.fb.array([]),
      achievements: this.fb.array([]),
      references: this.fb.array([]),
    });
  }

  // Getters for FormArrays and FormGroups
  get experience(): FormArray {
    return this.resumeForm.get('experience') as FormArray;
  }

  get projects(): FormArray {
    return this.resumeForm.get('projects') as FormArray;
  }

  get education(): FormArray {
    return this.resumeForm.get('education') as FormArray;
  }

  get certifications(): FormArray {
    return this.resumeForm.get('certifications') as FormArray;
  }

  get achievements(): FormArray {
    return this.resumeForm.get('achievements') as FormArray;
  }

  get references(): FormArray {
    return this.resumeForm.get('references') as FormArray;
  }

  get addressGroup(): FormGroup {
    return this.resumeForm.get('address') as FormGroup;
  }

  get languagesGroup(): FormGroup {
    return this.resumeForm.get('languages') as FormGroup;
  }

  get skillsGroup(): FormGroup {
    return this.resumeForm.get('skills') as FormGroup;
  }

  // --- CANDIDATE PICTURE HANDLING ---
  onPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.candidatePicturePreview = result;
        this.resumeForm.patchValue({ candidatePicture: result });
      };
      reader.readAsDataURL(file);
    }
  }

  removePicture(): void {
    this.candidatePicturePreview = null;
    this.resumeForm.patchValue({ candidatePicture: '' });
  }

  // --- EXPERIENCE FACTORY & ACTIONS ---
  createExperienceGroup(): FormGroup {
    return this.fb.group({
      companyName: ['', [Validators.required]],
      position: ['', [Validators.required]],
      location: ['Kochi'],
      displayDate: ['01 July 2026 – 28 September 2026'],
      description: ['Developed and enhanced web application features using React and Python.\nAssisted in building user interfaces and backend functionalities for a B2B Distributor Portal.'],
      experience: this.fb.group({
        dateOfJoining: ['2026-07-01', [Validators.required]],
        dateOfResign: ['2026-09-28', [Validators.required]],
      }),
    });
  }

  toggleExperienceSection(): void {
    this.showExperience = !this.showExperience;
    if (this.showExperience && this.experience.length === 0) {
      this.addExperience();
    } else if (!this.showExperience) {
      this.clearFormArray(this.experience);
    }
  }

  addExperience(): void {
    this.experience.push(this.createExperienceGroup());
    this.showExperience = true;
  }

  removeExperience(index: number): void {
    this.experience.removeAt(index);
    if (this.experience.length === 0) {
      this.showExperience = false;
    }
  }

  // --- PROJECTS FACTORY & ACTIONS ---
  createProjectGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      technologies: ['', [Validators.required]],
      description: ['', [Validators.required]],
      projectUrl: [''],
    });
  }

  toggleProjectsSection(): void {
    this.showProjects = !this.showProjects;
    if (this.showProjects && this.projects.length === 0) {
      this.addProject();
    } else if (!this.showProjects) {
      this.clearFormArray(this.projects);
    }
  }

  addProject(): void {
    this.projects.push(this.createProjectGroup());
    this.showProjects = true;
  }

  removeProject(index: number): void {
    this.projects.removeAt(index);
    if (this.projects.length === 0) {
      this.showProjects = false;
    }
  }

  // --- EDUCATION FACTORY & ACTIONS ---
  createEducationGroup(): FormGroup {
    return this.fb.group({
      institution: ['', [Validators.required]],
      degree: ['', [Validators.required]],
      yearRange: ['', [Validators.required]],
      grade: ['', [Validators.required]],
    });
  }

  toggleEducationSection(): void {
    this.showEducation = !this.showEducation;
    if (this.showEducation && this.education.length === 0) {
      this.addEducation();
    } else if (!this.showEducation) {
      this.clearFormArray(this.education);
    }
  }

  addEducation(): void {
    this.education.push(this.createEducationGroup());
    this.showEducation = true;
  }

  removeEducation(index: number): void {
    this.education.removeAt(index);
    if (this.education.length === 0) {
      this.showEducation = false;
    }
  }

  // --- CERTIFICATIONS FACTORY & ACTIONS ---
  createCertificationGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      issuer: ['', [Validators.required]],
      issueDate: [''],
      credentialUrl: [''],
    });
  }

  toggleCertificationsSection(): void {
    this.showCertifications = !this.showCertifications;
    if (this.showCertifications && this.certifications.length === 0) {
      this.addCertification();
    } else if (!this.showCertifications) {
      this.clearFormArray(this.certifications);
    }
  }

  addCertification(): void {
    this.certifications.push(this.createCertificationGroup());
    this.showCertifications = true;
  }

  removeCertification(index: number): void {
    this.certifications.removeAt(index);
    if (this.certifications.length === 0) {
      this.showCertifications = false;
    }
  }

  // --- ACHIEVEMENTS FACTORY & ACTIONS ---
  createAchievementGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      year: [''],
    });
  }

  toggleAchievementsSection(): void {
    this.showAchievements = !this.showAchievements;
    if (this.showAchievements && this.achievements.length === 0) {
      this.addAchievement();
    } else if (!this.showAchievements) {
      this.clearFormArray(this.achievements);
    }
  }

  addAchievement(): void {
    this.achievements.push(this.createAchievementGroup());
    this.showAchievements = true;
  }

  removeAchievement(index: number): void {
    this.achievements.removeAt(index);
    if (this.achievements.length === 0) {
      this.showAchievements = false;
    }
  }

  // --- REFERENCES FACTORY & ACTIONS ---
  createReferenceGroup(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      company: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
  }

  toggleReferencesSection(): void {
    this.showReferences = !this.showReferences;
    if (this.showReferences && this.references.length === 0) {
      this.addReference();
    } else if (!this.showReferences) {
      this.clearFormArray(this.references);
    }
  }

  addReference(): void {
    this.references.push(this.createReferenceGroup());
    this.showReferences = true;
  }

  removeReference(index: number): void {
    this.references.removeAt(index);
    if (this.references.length === 0) {
      this.showReferences = false;
    }
  }

  // --- ATS SCORE CALCULATION & OPTIMIZATION ---
  loadSampleJd(index: number): void {
    this.jobDescription = this.sampleJdPresets[index].text;
    this.runAtsAnalysis();
  }

  runAtsAnalysis(): void {
    const resumeData = this.submittedResumeData || this.resumeForm.getRawValue();
    this.atsResult = calculateAtsAnalysis(resumeData, this.jobDescription || this.sampleJdPresets[0].text);
  }

  /**
   * Automatically optimizes the resume for the entered job description
   * Infuses missing keywords and aligns career objective
   */
  optimizeResumeForJd(): void {
    if (!this.atsResult || this.atsResult.missingKeywords.length === 0) {
      this.optimizationMessage = 'Resume is already strongly aligned with this job description!';
      return;
    }

    const missing = this.atsResult.missingKeywords;
    const currentSkills = this.skillsGroup.value;

    // Categorize missing keywords into appropriate skills
    const newTools: string[] = [];
    const newConcepts: string[] = [];
    const newLanguages: string[] = [];

    missing.forEach(kw => {
      const lower = kw.toLowerCase();
      if (['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'linux'].includes(lower)) {
        newTools.push(kw);
      } else if (['microservices', 'unit testing', 'agile', 'scrum', 'system design'].includes(lower)) {
        newConcepts.push(kw);
      } else if (['typescript', 'java', 'c++', 'go'].includes(lower)) {
        newLanguages.push(kw);
      } else {
        newTools.push(kw);
      }
    });

    // Update skills controls
    let updatedTools = currentSkills.tools || '';
    if (newTools.length > 0) {
      updatedTools = `${updatedTools}, ${newTools.join(', ')}`;
    }

    let updatedConcepts = currentSkills.concepts || '';
    if (newConcepts.length > 0) {
      updatedConcepts = `${updatedConcepts}, ${newConcepts.join(', ')}`;
    }

    let updatedLanguages = currentSkills.programmingLanguages || '';
    if (newLanguages.length > 0) {
      updatedLanguages = `${updatedLanguages}, ${newLanguages.join(', ')}`;
    }

    // Align objective with JD
    const targetRole = this.sampleJdPresets[0].role;
    const updatedObjective = `Results-driven ${targetRole} with proven expertise in Python, web development, SQL, and modern software engineering. Experienced in designing scalable REST APIs, collaborating with cross-functional teams, and implementing reliable full-stack applications. Eager to contribute problem-solving and rapid learning abilities to deliver robust business value.`;

    this.resumeForm.patchValue({
      objective: updatedObjective,
      skills: {
        programmingLanguages: updatedLanguages,
        concepts: updatedConcepts,
        tools: updatedTools,
      },
    });

    // Update submitted resume data if available
    if (this.submittedResumeData) {
      this.submittedResumeData.objective = updatedObjective;
      this.submittedResumeData.skills = {
        ...this.submittedResumeData.skills,
        programmingLanguages: updatedLanguages,
        concepts: updatedConcepts,
        tools: updatedTools,
      };
    }

    // Recalculate ATS
    this.runAtsAnalysis();
    this.optimizationMessage = `🎉 Resume optimized! Missing keywords (${missing.slice(0, 4).join(', ')}) integrated into Skills & Objective. ATS score jumped to ${this.atsResult?.score}%!`;

    setTimeout(() => {
      this.optimizationMessage = null;
    }, 6000);
  }

  // --- PRINT / DOWNLOAD HELPER ---
  printResume(): void {
    this.activeView = 'preview';
    setTimeout(() => {
      window.print();
    }, 200);
  }

  // --- HELPER METHODS ---
  private clearFormArray(array: FormArray): void {
    while (array.length !== 0) {
      array.removeAt(0);
    }
  }

  getSelectedLanguages(langValues: { [key: string]: boolean } = {}): string[] {
    const values = langValues || this.languagesGroup.value || {};
    return Object.keys(values).filter((key) => values[key] === true);
  }

  isFieldInvalid(controlPath: string, parentGroup?: AbstractControl | null): boolean {
    const targetGroup = (parentGroup as FormGroup) || this.resumeForm;
    const control = targetGroup.get(controlPath);
    if (!control) return false;
    return !!(control.invalid && (control.touched || control.dirty || this.isSubmitted));
  }

  /**
   * Form Submission
   */
  onSubmit(): void {
    this.isSubmitted = true;

    if (this.resumeForm.invalid) {
      this.markAllAsTouched(this.resumeForm);
      this.activeView = 'form';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const formRaw = this.resumeForm.getRawValue();
    const selectedLanguages = this.getSelectedLanguages(formRaw.languages);

    this.submittedResumeData = {
      ...formRaw,
      candidatePicture: this.candidatePicturePreview || formRaw.candidatePicture,
      selectedLanguagesList: selectedLanguages.length > 0 ? selectedLanguages : ['English', 'Malayalam', 'Hindi'],
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Show confirmation message
    this.showSuccessMessage = true;

    // Recalculate ATS
    this.runAtsAnalysis();

    // Reset the Form After Submission as required by prompt
    this.resumeForm.reset();
    this.clearFormArray(this.experience);
    this.clearFormArray(this.projects);
    this.clearFormArray(this.education);
    this.clearFormArray(this.certifications);
    this.clearFormArray(this.achievements);
    this.clearFormArray(this.references);

    this.showExperience = false;
    this.showProjects = false;
    this.showEducation = false;
    this.showCertifications = false;
    this.showAchievements = false;
    this.showReferences = false;
    this.isSubmitted = false;

    // Switch to preview mode to showcase exact resume format
    this.activeView = 'preview';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Reset form state
   */
  resetForm(): void {
    this.resumeForm.reset();
    this.clearFormArray(this.experience);
    this.clearFormArray(this.projects);
    this.clearFormArray(this.education);
    this.clearFormArray(this.certifications);
    this.clearFormArray(this.achievements);
    this.clearFormArray(this.references);

    this.showExperience = false;
    this.showProjects = false;
    this.showEducation = false;
    this.showCertifications = false;
    this.showAchievements = false;
    this.showReferences = false;
    this.candidatePicturePreview = null;
    this.isSubmitted = false;
    this.showSuccessMessage = false;
    this.submittedResumeData = null;
    this.atsResult = null;
  }

  dismissConfirmation(): void {
    this.showSuccessMessage = false;
  }

  /**
   * Populates Aiswarya Manoj's exact resume from the uploaded screenshot
   */
  fillSampleData(): void {
    this.candidatePicturePreview = AISWARYA_PHOTO_BASE64;

    this.resumeForm.patchValue({
      candidatePicture: AISWARYA_PHOTO_BASE64,
      firstName: 'Aiswarya',
      lastName: 'Manoj',
      dob: '2001-05-18',
      email: 'aiswaryamanoj061@gmail.com',
      phone: '+91 7012370686',
      github: 'github.com/aiswaryamanoj',
      linkedin: 'linkedin.com/in/aiswaryamanoj',
      portfolio: 'Portfolio',
      gender: 'Female',
      objective:
        'Computer Science Engineering graduate with knowledge of Python, web development, SQL, and software development, with a keen interest in building scalable and user-friendly web applications. Eager to apply programming and problem-solving skills to develop reliable full-stack solutions using Python and continuously learn and adapt to new technologies.',
      skills: {
        programmingLanguages: 'Python, JavaScript, HTML, CSS',
        frameworks: 'Flask, React',
        databases: 'SQL, MySQL, MongoDB',
        tools: 'Git, GitHub, VS Code, Postman',
        concepts: 'OOPs, Data Structures, Algorithms, REST APIs, Web Development',
        softSkills: 'Problem Solving, Analytical Thinking, Communication, Team Collaboration, Adaptability, Time Management',
      },
      languages: {
        English: true,
        Hindi: true,
        Malayalam: true,
        Tamil: false,
        Others: false,
      },
      address: {
        houseNo: 'Kunnel House',
        street: 'Kattappana',
        city: 'Idukki',
        state: 'Kerala',
        pincode: '685508',
      },
    });

    // Experience (Full Stack Developer Intern)
    this.showExperience = true;
    this.clearFormArray(this.experience);
    const exp1 = this.createExperienceGroup();
    exp1.patchValue({
      position: 'Full Stack Developer Intern',
      companyName: 'Access Rooms, Kochi',
      location: 'Kochi',
      displayDate: '01 July 2026 – 28 September 2026',
      description: 'Developed and enhanced web application features using React and Python.\nAssisted in building user interfaces and backend functionalities for a B2B Distributor Portal.',
      experience: {
        dateOfJoining: '2026-07-01',
        dateOfResign: '2026-09-28',
      },
    });
    this.experience.push(exp1);

    // Education (Amal Jyothi + SMHSS)
    this.showEducation = true;
    this.clearFormArray(this.education);
    const edu1 = this.createEducationGroup();
    edu1.patchValue({
      institution: 'Amal Jyothi College of Engineering, Kanjirappally',
      degree: 'BTech in Computer Science and Engineering — CGPA 7.12',
      yearRange: '2022 – 2026',
      grade: 'CGPA 7.12',
    });
    this.education.push(edu1);

    const edu2 = this.createEducationGroup();
    edu2.patchValue({
      institution: 'SMHSS, Marykulam',
      degree: 'Higher Secondary Education — 97.7%',
      yearRange: '2019 – 2021',
      grade: '97.7%',
    });
    this.education.push(edu2);

    const edu3 = this.createEducationGroup();
    edu3.patchValue({
      institution: 'SMHSS, Marykulam',
      degree: 'Secondary Education — 97%',
      yearRange: '2018 – 2019',
      grade: '97%',
    });
    this.education.push(edu3);

    // Projects (MindTrace + B2B Distributor Portal)
    this.showProjects = true;
    this.clearFormArray(this.projects);
    const proj1 = this.createProjectGroup();
    proj1.patchValue({
      title: 'MindTrace: Explainable AI-based Language Model Visualization System',
      technologies: 'Python, PyTorch, Hugging Face Transformers, Flask, JavaScript, HTML, CSS',
      description: 'Developed a web-based tool to demonstrate how transformer-based language models make predictions, including a feature to show how word meanings change across different contexts.',
      projectUrl: '',
    });
    this.projects.push(proj1);

    const proj2 = this.createProjectGroup();
    proj2.patchValue({
      title: 'B2B Distributor Portal',
      technologies: 'React, Python',
      description: 'Developed and enhanced web application features using React and Python.\nAssisted in building user interfaces and backend functionalities for a B2B Distributor Portal.',
      projectUrl: '',
    });
    this.projects.push(proj2);

    // Certifications (SQL, Oracle, Python, Cloud)
    this.showCertifications = true;
    this.clearFormArray(this.certifications);
    const certs = [
      { title: 'SQL: A Practical Introduction for Querying Databases', issuer: 'IBM (Coursera)' },
      { title: 'Database Programming with SQL', issuer: 'Oracle' },
      { title: 'Crash Course on Python', issuer: 'Google (Coursera)' },
      { title: 'Google Cloud DevOps Fundamentals', issuer: 'Whizlabs (Coursera)' },
      { title: 'Cloud Infrastructure 2025 Certified Generative AI Professional', issuer: 'Oracle' },
    ];
    certs.forEach((c) => {
      const cg = this.createCertificationGroup();
      cg.patchValue({ title: `${c.title} — ${c.issuer}`, issuer: c.issuer });
      this.certifications.push(cg);
    });

    // Achievements (NACORE, AICERA, Smart India Hackathon)
    this.showAchievements = true;
    this.clearFormArray(this.achievements);
    const achs = [
      { title: 'NACORE: Published research paper.' },
      { title: 'AICERA: Published research paper.' },
      { title: 'Smart India Hackathon 2024: Shortlisted finalist; Certificate of Appreciation.' },
    ];
    achs.forEach((a) => {
      const ag = this.createAchievementGroup();
      ag.patchValue({ title: a.title, description: a.title });
      this.achievements.push(ag);
    });

    // Also populate submitted resume data so preview is ready immediately
    this.submittedResumeData = this.resumeForm.getRawValue();
    this.submittedResumeData.candidatePicture = this.candidatePicturePreview;
    this.submittedResumeData.selectedLanguagesList = ['English', 'Malayalam', 'Hindi'];
    this.submittedResumeData.submittedAt = 'Just now';

    this.runAtsAnalysis();
  }

  private markAllAsTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = (formGroup.controls as any)[key];
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markAllAsTouched(control);
      } else if (control instanceof AbstractControl) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });
  }

  // Splits multiline string into bullet points
  splitLines(text: string | null | undefined): string[] {
    if (!text) return [];
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  }
}
