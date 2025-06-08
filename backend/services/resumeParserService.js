const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

class ResumeParserService {
  constructor() {
    // Common section headers and their variations
    this.sectionHeaders = {
      personal: [
        'personal information', 'personal details', 'contact information', 
        'contact details', 'about me', 'profile', 'summary', 'objective'
      ],
      education: [
        'education', 'educational background', 'academic background', 
        'qualifications', 'degrees', 'schooling', 'academics'
      ],
      experience: [
        'experience', 'work experience', 'professional experience', 
        'employment history', 'career history', 'work history', 
        'professional background', 'employment', 'career'
      ],
      skills: [
        'skills', 'technical skills', 'core competencies', 'competencies',
        'expertise', 'technologies', 'proficiencies', 'abilities',
        'technical expertise', 'key skills'
      ],
      projects: [
        'projects', 'personal projects', 'key projects', 'notable projects',
        'project experience', 'portfolio', 'achievements'
      ],
      certifications: [
        'certifications', 'certificates', 'licenses', 'credentials',
        'professional certifications', 'awards'
      ]
    };

    // Common patterns for extracting contact information
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b|(?:\+91|91)?\s?[6-9]\d{9}/gi,
      linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi,
      github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi,
      website: /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[\w.-]*)*\/?/gi
    };
  }

  /**
   * Main function to parse resume from buffer
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} mimeType - The MIME type of the file
   * @param {string} originalName - Original filename
   * @returns {Object} Parsed resume data
   */
  async parseResume(fileBuffer, mimeType, originalName) {
    try {
      console.log(`Starting resume parsing for file: ${originalName}`);
      
      let rawText = '';
      const fileExtension = path.extname(originalName).toLowerCase();

      // Extract text based on file type
      if (fileExtension === '.pdf' || mimeType === 'application/pdf') {
        rawText = await this.extractTextFromPDF(fileBuffer);
      } else if (['.doc', '.docx'].includes(fileExtension) || 
                 mimeType.includes('application/msword') || 
                 mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        rawText = await this.extractTextFromDOCX(fileBuffer);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('Could not extract text from the resume file');
      }

      console.log(`Extracted text length: ${rawText.length} characters`);

      // Parse the extracted text
      const parsedData = this.parseResumeText(rawText);

      return {
        success: true,
        data: parsedData,
        rawText: rawText.substring(0, 1000) // First 1000 chars for debugging
      };

    } catch (error) {
      console.error('Resume parsing error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Extract text from PDF buffer
   * @param {Buffer} buffer - PDF file buffer
   * @returns {string} Extracted text
   */
  async extractTextFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Extract text from DOCX buffer
   * @param {Buffer} buffer - DOCX file buffer
   * @returns {string} Extracted text
   */
  async extractTextFromDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  /**
   * Parse the extracted text and identify sections
   * @param {string} text - Raw text from resume
   * @returns {Object} Structured resume data
   */
  parseResumeText(text) {
    const normalizedText = this.normalizeText(text);
    const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract phone number first - it's a priority field
    const phoneNumber = this.extractPhoneNumber(normalizedText);

    // Extract email
    const emailMatch = normalizedText.match(this.patterns.email);
    const email = emailMatch ? emailMatch[0] : '';

    // Extract name from the beginning of document
    const name = this.extractName(lines);

    // Find sections
    const sections = this.identifySections(lines);

    // Extract focused section content - our 5 key fields
    const education = this.extractEducation(sections, lines);
    const experience = this.extractExperience(sections, lines);
    const skills = this.extractSkills(sections, lines, normalizedText);
    const projects = this.extractProjects(sections, lines);

    // Calculate years of experience
    const yearsOfExperience = this.calculateYearsOfExperience(experience);

    return {
      // Personal info (focused extraction)
      personalInfo: {
        name: name,
        email: email,
        phone: phoneNumber,
        location: this.extractLocation(normalizedText, lines)
      },
      
      // Core 5 fields for autofill
      phoneNumber,
      education,
      experience,
      skills,
      projects,
      yearsOfExperience,
      
      // Raw section texts for fallback
      educationText: this.getSectionText(sections.education, lines),
      experienceText: this.getSectionText(sections.experience, lines),
      skillsText: this.getSectionText(sections.skills, lines),
      projectsText: this.getSectionText(sections.projects, lines)
    };
  }

  /**
   * Normalize text for better processing
   * @param {string} text - Raw text
   * @returns {string} Normalized text
   */
  normalizeText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      // Insert line breaks before common section headers (but keep them on their own line)
      .replace(/\b(OBJECTIVE|SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS)\b/gi, '\n$1\n')
      // Insert line breaks before bullet points
      .replace(/•/g, '\n•')
      .replace(/◦/g, '\n◦')
      // Insert line breaks before years (likely job/education dates)
      .replace(/\b(19|20)\d{2}\s*-/g, '\n$&')
      // Clean up multiple newlines but preserve single ones
      .replace(/\n{3,}/g, '\n\n')
      // Normalize spaces but don't collapse all whitespace
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  /**
   * Extract phone number from resume text
   * @param {string} text - Resume text
   * @returns {string} Phone number
   */
  extractPhoneNumber(text) {
    // Enhanced phone number patterns for better extraction
    const phonePatterns = [
      // Indian phone patterns
      /(?:\+91|91)[-.\s]?[6-9]\d{9}/g,
      /[6-9]\d{9}/g,
      // US/International patterns
      /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      // General patterns
      /(?:\+\d{1,3}[-.\s]?)?\d{10,}/g
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Find the most likely phone number (prefer longer, more complete ones)
        const validNumbers = matches
          .map(num => this.cleanPhoneNumber(num))
          .filter(num => num.length >= 10 && num.length <= 15)
          .sort((a, b) => b.length - a.length);
        
        if (validNumbers.length > 0) {
          return validNumbers[0];
        }
      }
    }

    return '';
  }

  /**
   * Extract name from the first few lines
   * @param {Array} lines - Text lines
   * @returns {string} Extracted name
   */
  extractName(lines) {
    // First, try to extract name from first few words of the first line
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const words = firstLine.split(/\s+/);
      
      // Look for name pattern in the first few words
      for (let i = 0; i < Math.min(6, words.length - 1); i++) {
        const nameCandidate = words.slice(i, i + 2).join(' ');
        
        // Skip if it contains unwanted characters
        if (nameCandidate.includes('@') || nameCandidate.includes('+') || 
            nameCandidate.includes('|') || nameCandidate.includes('http')) continue;
        
        // Check if it looks like a name (two words, both starting with capital)
        const nameParts = nameCandidate.split(' ');
        if (nameParts.length === 2 && 
            nameParts.every(part => /^[A-Z][a-z]+$/.test(part))) {
          return nameCandidate;
        }
      }
    }
    
    // Fallback: try the original line-by-line approach
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      
      // Skip lines that are too short or too long
      if (line.length < 2 || line.length > 60) continue;
      
      // Skip lines with email or phone patterns
      if (this.patterns.email.test(line) || this.patterns.phone.test(line)) continue;
      
      // Skip lines with URLs
      if (line.includes('http') || line.includes('www.')) continue;
      
      // Skip common header words
      const lowerLine = line.toLowerCase();
      if (['resume', 'cv', 'curriculum vitae', 'profile', 'contact', 'objective', 'summary'].some(word => lowerLine.includes(word))) continue;
      
      // Skip lines with + symbols (usually phone numbers)
      if (line.includes('+')) continue;
      
      // Skip lines with @ symbols (emails)
      if (line.includes('@')) continue;
      
      // Skip lines with | symbols (usually contact info)
      if (line.includes('|')) continue;
      
      // Check if it looks like a name (1-4 words, reasonable length)
      const words = line.split(/\s+/).filter(word => word.length > 0);
      if (words.length >= 1 && words.length <= 4) {
        // Check if most words start with capital letters or are all caps
        const capitalizedWords = words.filter(word => 
          /^[A-Z]/.test(word) || word === word.toUpperCase()
        );
        
        if (capitalizedWords.length >= words.length * 0.5) {
          return line;
        }
      }
    }
    
    return '';
  }

  /**
   * Clean and format phone number
   * @param {string} phone - Raw phone number
   * @returns {string} Cleaned phone number
   */
  cleanPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Indian numbers starting with +91 or 91
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    
    // Handle US numbers starting with 1
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Extract location information
   * @param {string} text - Resume text
   * @param {Array} lines - Text lines
   * @returns {string} Location
   */
  extractLocation(text, lines) {
    // Look for common location patterns
    const locationPatterns = [
      /([A-Z][a-z]+,\s*[A-Z]{2})/g, // City, State
      /([A-Z][a-z]+\s*,\s*[A-Z][a-z]+)/g, // City, Country
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }

    return '';
  }

  /**
   * Identify sections in the resume
   * @param {Array} lines - Text lines
   * @returns {Object} Section boundaries
   */
  identifySections(lines) {
    const sections = {
      education: { start: -1, end: -1 },
      experience: { start: -1, end: -1 },
      skills: { start: -1, end: -1 },
      projects: { start: -1, end: -1 },
      certifications: { start: -1, end: -1 }
    };

    const sectionStarts = [];

    // Debug: Log all lines to see what we're working with
    console.log('=== Analyzing lines for section detection ===');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();
      
      // Debug specific lines that might be headers
      if (line.length < 50 && line.length > 2) {
        console.log(`Line ${i}: "${line}" (lower: "${lowerLine}")`);
      }
      
      // Education section - more flexible matching
      if (sections.education.start === -1) {
        if (lowerLine === 'education' || 
            lowerLine === 'educational background' || 
            lowerLine === 'academic background' ||
            lowerLine === 'qualifications' ||
            lowerLine === 'academic' ||
            line.match(/^EDUCATION$/i)) {
          console.log(`✅ Found EDUCATION section at line ${i}: "${line}"`);
          sections.education.start = i;
          sectionStarts.push({ type: 'education', index: i });
        }
      }
      
      // Experience section - more flexible matching
      if (sections.experience.start === -1) {
        if (lowerLine === 'experience' || 
            lowerLine === 'work experience' || 
            lowerLine === 'professional experience' ||
            lowerLine === 'employment history' ||
            lowerLine === 'work' ||
            lowerLine === 'employment' ||
            line.match(/^EXPERIENCE$/i)) {
          console.log(`✅ Found EXPERIENCE section at line ${i}: "${line}"`);
          sections.experience.start = i;
          sectionStarts.push({ type: 'experience', index: i });
        }
      }
      
      // Skills section - more flexible matching
      if (sections.skills.start === -1) {
        if (lowerLine === 'skills' || 
            lowerLine === 'technical skills' || 
            lowerLine === 'core competencies' ||
            lowerLine === 'competencies' ||
            lowerLine === 'key skills' ||
            lowerLine === 'expertise' ||
            line.match(/^SKILLS$/i)) {
          console.log(`✅ Found SKILLS section at line ${i}: "${line}"`);
          sections.skills.start = i;
          sectionStarts.push({ type: 'skills', index: i });
        }
      }
      
      // Projects section - more flexible matching
      if (sections.projects.start === -1) {
        if (lowerLine === 'projects' || 
            lowerLine === 'personal projects' || 
            lowerLine === 'key projects' ||
            lowerLine === 'portfolio' ||
            line.match(/^PROJECTS$/i)) {
          // Skip false positive "projects" within sentences
          if (i > 0 && lines[i-1].trim().length > 0 && 
              !lines[i-1].toLowerCase().includes('education') &&
              !lines[i-1].toLowerCase().includes('experience') &&
              !lines[i-1].toLowerCase().includes('skills')) {
            // This might be the word "projects" within a sentence, skip
            if (line.length < 15 && line.toLowerCase() === 'projects' && 
                i < lines.length - 1 && lines[i+1].length > 20) {
              // This is likely within a sentence, continue
              continue;
            }
          }
          console.log(`✅ Found PROJECTS section at line ${i}: "${line}"`);
          sections.projects.start = i;
          sectionStarts.push({ type: 'projects', index: i });
        }
      }
      
      // Certifications section - more flexible matching
      if (sections.certifications.start === -1) {
        if (lowerLine === 'certifications' || 
            lowerLine === 'certificates' || 
            lowerLine === 'awards' ||
            line.match(/^CERTIFICATIONS$/i) ||
            line.match(/^CERTIFICATES$/i) ||
            line.match(/^AWARDS$/i)) {
          console.log(`✅ Found CERTIFICATIONS section at line ${i}: "${line}"`);
          sections.certifications.start = i;
          sectionStarts.push({ type: 'certifications', index: i });
        }
      }
    }

    // Set end boundaries
    sectionStarts.sort((a, b) => a.index - b.index);
    
    for (let i = 0; i < sectionStarts.length; i++) {
      const current = sectionStarts[i];
      const next = sectionStarts[i + 1];
      sections[current.type].end = next ? next.index - 1 : lines.length - 1;
    }

    const detectedSections = Object.keys(sections).filter(key => sections[key].start !== -1);
    console.log('Detected sections:', detectedSections);
    console.log('Section boundaries:', detectedSections.map(s => `${s}: ${sections[s].start}-${sections[s].end}`));
    
    return sections;
  }

  /**
   * Extract education information
   * @param {Object} sections - Section boundaries
   * @param {Array} lines - Text lines
   * @returns {Array} Education entries
   */
  extractEducation(sections, lines) {
    const education = [];

    if (sections.education.start !== -1) {
      const educationLines = lines.slice(sections.education.start + 1, sections.education.end + 1);
      
      console.log('=== Processing Education Lines ===');
      educationLines.forEach((line, index) => {
        console.log(`Line ${sections.education.start + 1 + index}: "${line}" (lower: "${line.toLowerCase()}")`);
      });
      
      let currentEntry = null;
      let collectedLines = [];
      
      for (let i = 0; i < educationLines.length; i++) {
        const line = educationLines[i].trim();
        if (!line || line.length < 2) continue;
        
        collectedLines.push(line);
        
        // Check if this line contains an institution (stronger indicator of new education entry)
        const institutionMatch = line.match(/\b(university|college|institute|school|academy|uit|eth|punjab|jnv|sheohar)\b/i);
        
        // Check if this line looks like a degree
        const degreeMatch = line.match(/\b(bachelor|master|phd|doctorate|diploma|certificate|b\.?\s?[asce]|m\.?\s?[asce]|mba|bba|be|btech|mtech|ms|ma|ba|bsc|msc|engineering|degree|secondary|senior|matric|post-matric)\b/i);
        
        // Check for graduation years (strong indicator of education entry)
        const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
        const dateRangeMatch = line.match(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}|\b(19|20)\d{2}\s*\|\s*\w+/i);
        
        // Check for percentage/GPA
        const gradeMatch = line.match(/(\d+\.?\d*)%|gpa:?\s*(\d+\.?\d*)|cgpa:?\s*(\d+\.?\d*)/i);
        
        // Look ahead to see if next few lines are related to current education entry
        const isEducationBoundary = institutionMatch || 
                                  (degreeMatch && (yearMatch || dateRangeMatch)) ||
                                  (i === educationLines.length - 1);
        
        if (isEducationBoundary || i === educationLines.length - 1) {
          // Process collected lines as one education entry
          if (collectedLines.length > 0) {
            const combinedText = collectedLines.join(' ');
            
            // Extract information from the combined text
            const entryInstitutionMatch = combinedText.match(/\b([A-Z][A-Z,.\s]*(?:university|college|institute|school|academy|uit|eth|punjab|jnv|sheohar)[A-Z,.\s]*)\b/i);
            const entryDegreeMatch = combinedText.match(/\b(bachelor\s+of\s+engineering|secondary\s+education|senior\s+secondary|bachelor|master|phd|doctorate|diploma|certificate|b\.?\s?[asce]|m\.?\s?[asce]|mba|bba|be|btech|mtech|ms|ma|ba|bsc|msc|engineering|degree|matric|post-matric)\b/i);
            const entryFieldMatch = combinedText.match(/\b(computer\s+science|electrical|mechanical|civil|information\s+technology|it|cse|ece|eee|class\s+\d+)\b/i);
            const entryYearMatches = combinedText.match(/\b(19|20)\d{2}\b/g);
            const entryDateRangeMatch = combinedText.match(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}|\b(19|20)\d{2}\s*\|\s*\w+/i);
            const entryGradeMatch = combinedText.match(/(\d+\.?\d*)%|gpa:?\s*(\d+\.?\d*)|cgpa:?\s*(\d+\.?\d*)/i);
            
            const entry = {
              institution: entryInstitutionMatch ? entryInstitutionMatch[0].trim() : '',
              degree: entryDegreeMatch ? entryDegreeMatch[0].trim() : '',
              field: entryFieldMatch ? entryFieldMatch[0].trim() : '',
              year: '',
              startYear: '',
              endYear: '',
              duration: entryDateRangeMatch ? entryDateRangeMatch[0].trim() : '',
              grade: entryGradeMatch ? (entryGradeMatch[1] || entryGradeMatch[2] || entryGradeMatch[3]) : '',
              rawText: combinedText.trim(),
              originalLines: [...collectedLines]
            };
            
            // Extract year information more precisely
            if (entryYearMatches && entryYearMatches.length > 0) {
              if (entryYearMatches.length === 1) {
                entry.year = entryYearMatches[0];
                entry.endYear = entryYearMatches[0];
              } else if (entryYearMatches.length >= 2) {
                entry.startYear = entryYearMatches[0];
                entry.endYear = entryYearMatches[entryYearMatches.length - 1];
                entry.year = entry.endYear; // Use end year as primary year
              }
            }
            
            // If we have meaningful data, add the entry
            if (entry.institution || entry.degree || entry.year) {
              education.push(entry);
              console.log('📝 Created education entry:', entry);
            }
            
            // Reset for next entry (but keep last line if it might be start of next entry)
            if (i < educationLines.length - 1 && institutionMatch) {
              collectedLines = [line]; // Start new entry with current line
            } else {
              collectedLines = [];
            }
          }
        }
      }
    }

    // Fallback: if no education found in section, search entire document
    if (education.length === 0) {
      console.log('🔍 No education found in section, searching entire document...');
      
      const degreePatterns = [
        /\b(bachelor\s+of\s+engineering|secondary\s+education|senior\s+secondary|bachelor|master|phd|doctorate|diploma|certificate|b\.?\s?[asce]|m\.?\s?[asce]|mba|bba|be|btech|mtech|ms|ma|ba|bsc|msc|engineering|degree|matric|post-matric)\b/i
      ];

      const institutionPatterns = [
        /\b([A-Z][A-Z,.\s]*(?:university|college|institute|school|academy|uit|eth|punjab|jnv|sheohar)[A-Z,.\s]*)\b/i
      ];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 5) continue;

        const hasDegree = degreePatterns.some(pattern => pattern.test(trimmedLine));
        const hasInstitution = institutionPatterns.some(pattern => pattern.test(trimmedLine));
        const yearMatch = trimmedLine.match(/\b(19|20)\d{2}\b/);
        const gradeMatch = trimmedLine.match(/(\d+\.?\d*)%|gpa:?\s*(\d+\.?\d*)|cgpa:?\s*(\d+\.?\d*)/i);

        if (hasDegree || hasInstitution || (yearMatch && gradeMatch)) {
          const entry = {
            institution: hasInstitution ? trimmedLine : '',
            degree: hasDegree ? trimmedLine : '',
            year: yearMatch ? yearMatch[0] : '',
            grade: gradeMatch ? (gradeMatch[1] || gradeMatch[2] || gradeMatch[3]) : '',
            rawText: trimmedLine
          };
          education.push(entry);
        }
      }
    }

    console.log(`📚 Found ${education.length} education entries:`, education);
    return education.slice(0, 5); // Limit to 5 education entries
  }

  /**
   * Extract work experience
   * @param {Object} sections - Section boundaries
   * @param {Array} lines - Text lines
   * @returns {Array} Experience entries
   */
  extractExperience(sections, lines) {
    const experience = [];

    if (sections.experience.start !== -1) {
      const experienceLines = lines.slice(sections.experience.start + 1, sections.experience.end + 1);
      
      console.log('=== Processing Experience Lines ===');
      experienceLines.forEach((line, index) => {
        console.log(`Line ${sections.experience.start + 1 + index}: "${line}"`);
      });
      
      let collectedLines = [];
      
      for (let i = 0; i < experienceLines.length; i++) {
        const line = experienceLines[i].trim();
        if (!line || line.length < 2) continue;
        
        collectedLines.push(line);
        
        // Check for job titles and companies
        const jobTitleMatch = line.match(/\b(software\s+engineer|web\s+developer|full\s+stack|frontend|backend|developer|engineer|analyst|manager|consultant|designer|architect|lead|senior|junior|intern|trainee)\b/i);
        const companyMatch = line.match(/\b([A-Z][A-Za-z\s&.,-]*(?:inc|ltd|llc|corp|corporation|company|technologies|tech|solutions|systems|services|pvt|private|limited))\b/i);
        
        // Check for dates (strong indicator of experience entry)
        const dateRangeMatch = line.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present|current)|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}/i);
        const yearMatch = line.match(/\b(19|20)\d{2}\b/g);
        
        // Check if this looks like an experience boundary
        const isExperienceBoundary = jobTitleMatch || companyMatch || dateRangeMatch ||
                                   (i === experienceLines.length - 1);
        
        if (isExperienceBoundary || i === experienceLines.length - 1) {
          // Process collected lines as one experience entry
          if (collectedLines.length > 0) {
            const combinedText = collectedLines.join(' ');
            
            // Extract information from the combined text
            const entryJobTitleMatch = combinedText.match(/\b(software\s+engineer|web\s+developer|full\s+stack|frontend|backend|developer|engineer|analyst|manager|consultant|designer|architect|lead|senior|junior|intern|trainee)\b/i);
            const entryCompanyMatch = combinedText.match(/\b([A-Z][A-Za-z\s&.,-]*(?:inc|ltd|llc|corp|corporation|company|technologies|tech|solutions|systems|services|pvt|private|limited))\b/i);
            const entryDateRangeMatch = combinedText.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present|current)|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(19|20)\d{2}/i);
            const entryYearMatches = combinedText.match(/\b(19|20)\d{2}\b/g);
            
            // Extract location if available
            const locationMatch = combinedText.match(/\b([A-Z][a-z]+,\s*[A-Z][a-z]+|\w+,\s*\w+)\b/);
            
            const entry = {
              title: entryJobTitleMatch ? entryJobTitleMatch[0].trim() : '',
              company: entryCompanyMatch ? entryCompanyMatch[0].trim() : '',
              duration: entryDateRangeMatch ? entryDateRangeMatch[0].trim() : '',
              location: locationMatch ? locationMatch[0].trim() : '',
              startYear: '',
              endYear: '',
              description: combinedText.trim(),
              rawText: combinedText.trim(),
              originalLines: [...collectedLines]
            };
            
            // Extract year information
            if (entryYearMatches && entryYearMatches.length > 0) {
              if (entryYearMatches.length === 1) {
                entry.startYear = entryYearMatches[0];
                entry.endYear = entryYearMatches[0];
              } else if (entryYearMatches.length >= 2) {
                entry.startYear = entryYearMatches[0];
                entry.endYear = entryYearMatches[entryYearMatches.length - 1];
              }
            }
            
            // If we have meaningful data, add the entry
            if (entry.title || entry.company || entry.duration) {
              experience.push(entry);
              console.log('💼 Created experience entry:', entry);
            }
            
            // Reset for next entry
            if (i < experienceLines.length - 1 && (jobTitleMatch || companyMatch)) {
              collectedLines = [line]; // Start new entry with current line
            } else {
              collectedLines = [];
            }
          }
        }
      }
    }

    // Fallback: search entire document if no experience found in section
    if (experience.length === 0) {
      console.log('🔍 No experience found in section, searching entire document...');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length < 10) continue;

        const jobTitleMatch = trimmedLine.match(/\b(software\s+engineer|web\s+developer|developer|engineer|analyst|manager|consultant)\b/i);
        const companyMatch = trimmedLine.match(/\b([A-Z][A-Za-z\s&.,-]*(?:inc|ltd|llc|corp|corporation|company|technologies|tech|solutions|systems|services))\b/i);
        const dateMatch = trimmedLine.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present)/i);

        if ((jobTitleMatch && dateMatch) || (companyMatch && dateMatch)) {
          const entry = {
            title: jobTitleMatch ? jobTitleMatch[0] : '',
            company: companyMatch ? companyMatch[0] : '',
            duration: dateMatch ? dateMatch[0] : '',
            description: trimmedLine,
            rawText: trimmedLine
          };
          experience.push(entry);
        }
      }
    }

    console.log(`💼 Found ${experience.length} experience entries:`, experience);
    return experience.slice(0, 5); // Limit to 5 experience entries
  }

  /**
   * Extract skills
   * @param {Object} sections - Section boundaries
   * @param {Array} lines - Text lines
   * @param {string} fullText - Full resume text
   * @returns {Array} Skills list
   */
  extractSkills(sections, lines, fullText) {
    const skills = new Set();

    // First try to get from skills section
    if (sections.skills.start !== -1) {
      const skillsLines = lines.slice(sections.skills.start + 1, sections.skills.end + 1);
      
      for (const line of skillsLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Split by common delimiters
        const skillItems = trimmedLine.split(/[,;|•\-\*\n\t]/);
        
        for (const skill of skillItems) {
          const cleanSkill = skill.trim().replace(/[^\w\s\.\+\#\-]/g, '');
          if (cleanSkill.length > 1 && cleanSkill.length < 30) {
            skills.add(cleanSkill);
          }
        }
      }
    }

    // Comprehensive technical skills database
    const technicalSkills = [
      // Programming Languages
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
      'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
      
      // Web Technologies
      'html', 'css', 'sass', 'scss', 'less', 'bootstrap', 'tailwind', 'material-ui', 'bulma',
      'react', 'angular', 'vue', 'svelte', 'ember', 'backbone', 'jquery', 'alpine.js',
      'next.js', 'nuxt.js', 'gatsby', 'astro', 'webpack', 'vite', 'parcel', 'rollup',
      
      // Backend & Frameworks
      'node.js', 'express', 'nestjs', 'fastify', 'koa', 'django', 'flask', 'fastapi',
      'spring', 'hibernate', 'struts', 'laravel', 'symfony', 'codeigniter', 'rails',
      'asp.net', '.net', 'entity framework',
      
      // Databases
      'mysql', 'postgresql', 'sqlite', 'oracle', 'sql server', 'mongodb', 'cassandra',
      'redis', 'elasticsearch', 'neo4j', 'firebase', 'supabase', 'dynamodb', 'couchdb',
      
      // Cloud & DevOps
      'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'cloudflare',
      'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'circleci',
      'terraform', 'ansible', 'chef', 'puppet', 'vagrant',
      
      // Version Control & Tools
      'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
      'jira', 'confluence', 'trello', 'asana', 'notion', 'slack', 'teams',
      
      // Testing
      'jest', 'cypress', 'selenium', 'mocha', 'chai', 'jasmine', 'karma', 'pytest',
      'junit', 'testng', 'mockito', 'postman', 'insomnia',
      
      // Mobile Development
      'react native', 'flutter', 'ionic', 'xamarin', 'cordova', 'phonegap',
      'android', 'ios', 'xcode', 'android studio',
      
      // Data Science & AI
      'pandas', 'numpy', 'scipy', 'scikit-learn', 'tensorflow', 'keras', 'pytorch',
      'jupyter', 'anaconda', 'tableau', 'power bi', 'qlik', 'd3.js', 'plotly',
      
      // Operating Systems & Tools
      'linux', 'ubuntu', 'centos', 'windows', 'macos', 'unix',
      'vim', 'emacs', 'vscode', 'intellij', 'eclipse', 'sublime', 'atom',
      
      // Other Technologies
      'rest api', 'graphql', 'soap', 'microservices', 'serverless', 'websockets',
      'oauth', 'jwt', 'ssl', 'https', 'tcp/ip', 'http', 'dns', 'cdn',
      'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd', 'tdd', 'bdd'
    ];

    const lowerText = fullText.toLowerCase();
    
    // Search for technical skills in the entire text
    for (const skill of technicalSkills) {
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (skillRegex.test(lowerText)) {
        skills.add(skill);
      }
    }

    // Also search for skill patterns in lines
    const skillPatterns = [
      /\b[\w\.\+\#\-]+\s*(programming|development|framework|library|tool|technology|language|database|platform)\b/i,
      /\b(proficient|experienced|expert|skilled|familiar)\s+(?:in|with)\s+([\w\s,]+)/i
    ];

    for (const line of lines) {
      for (const pattern of skillPatterns) {
        const match = line.match(pattern);
        if (match) {
          const extractedSkills = match[0].split(/[,\s]+/).filter(s => s.length > 2 && s.length < 20);
          extractedSkills.forEach(skill => skills.add(skill.trim()));
        }
      }
    }

    return Array.from(skills).slice(0, 50); // Limit to 50 skills
  }

  /**
   * Extract projects
   * @param {Object} sections - Section boundaries
   * @param {Array} lines - Text lines
   * @returns {Array} Projects list
   */
  extractProjects(sections, lines) {
    const projects = [];

    // If we found a projects section, parse it
    if (sections.projects.start !== -1) {
      const projectLines = lines.slice(sections.projects.start + 1, sections.projects.end + 1);

      let currentProject = {};
      let descriptionLines = [];

      for (const line of projectLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Project titles are usually formatted with bullets or colons
        const isProjectTitle = (
          trimmedLine.match(/^[•◦\-\*]\s*[A-Z][a-zA-Z\s\-()]+:?/) || // Bullet point titles
          trimmedLine.match(/^[A-Z][a-zA-Z\s\-()]+\s*:/) || // Title with colon
          (trimmedLine.match(/^[A-Z][a-zA-Z\s\-()]+$/) && trimmedLine.length < 80 && !trimmedLine.includes('http'))
        );

        if (isProjectTitle) {
          if (Object.keys(currentProject).length > 0) {
            currentProject.description = descriptionLines.join(' ');
            projects.push(currentProject);
            descriptionLines = [];
          }
          
          // Clean the title
          let title = trimmedLine
            .replace(/^[•◦\-\*]\s*/, '') // Remove bullet points
            .replace(/\s*:$/, '') // Remove trailing colon
            .trim();
            
          currentProject = { title };
          continue;
        }

        // Check for URLs, GitHub links, or demo links
        if (trimmedLine.includes('http') || trimmedLine.includes('github') || trimmedLine.includes('demo')) {
          if (currentProject.title) {
            currentProject.link = trimmedLine;
          }
          continue;
        }

        // Check for tools/technologies mentioned
        if (trimmedLine.toLowerCase().includes('tools:') || 
            trimmedLine.toLowerCase().includes('technologies:') ||
            trimmedLine.toLowerCase().includes('tech stack:')) {
          if (currentProject.title) {
            currentProject.technologies = trimmedLine;
          }
          continue;
        }

        // Everything else is description
        if (currentProject.title) {
          descriptionLines.push(trimmedLine);
        }
      }

      if (Object.keys(currentProject).length > 0) {
        currentProject.description = descriptionLines.join(' ');
        projects.push(currentProject);
      }
    }

    // If no projects found in section, search entire document for project patterns
    if (projects.length === 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for project indicators
        if (line.toLowerCase().includes('project') && 
            (line.includes(':') || line.includes('app') || line.includes('system'))) {
          const project = {
            title: line,
            description: '',
            technologies: '',
            link: ''
          };
          
          // Look for description in next few lines
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.length > 10 && !nextLine.toLowerCase().includes('project')) {
              project.description = nextLine;
              break;
            }
          }
          
          projects.push(project);
        }
      }
    }

    return projects.slice(0, 10); // Limit to 10 projects
  }

  /**
   * Extract certifications
   * @param {Object} sections - Section boundaries
   * @param {Array} lines - Text lines
   * @returns {Array} Certifications list
   */
  extractCertifications(sections, lines) {
    if (sections.certifications.start === -1) return [];

    const certLines = lines.slice(sections.certifications.start + 1, sections.certifications.end + 1);
    const certifications = [];

    for (const line of certLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.length > 3) {
        certifications.push({
          name: trimmedLine,
          year: trimmedLine.match(/\b(19|20)\d{2}\b/)?.[0] || ''
        });
      }
    }

    return certifications;
  }

  /**
   * Calculate years of experience from experience entries
   * @param {Array} experience - Experience entries
   * @returns {number} Years of experience
   */
  calculateYearsOfExperience(experience) {
    let totalMonths = 0;
    const currentYear = new Date().getFullYear();

    for (const exp of experience) {
      if (exp.duration) {
        const yearMatches = exp.duration.match(/\b(19|20)\d{2}\b/g);
        if (yearMatches && yearMatches.length >= 2) {
          const startYear = parseInt(yearMatches[0]);
          const endYear = parseInt(yearMatches[1]);
          totalMonths += (endYear - startYear) * 12;
        } else if (yearMatches && yearMatches.length === 1 && exp.duration.toLowerCase().includes('present')) {
          const startYear = parseInt(yearMatches[0]);
          totalMonths += (currentYear - startYear) * 12;
        }
      }
    }

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get raw text for a section
   * @param {Object} section - Section boundaries
   * @param {Array} lines - Text lines
   * @returns {string} Section text
   */
  getSectionText(section, lines) {
    if (section.start === -1) return '';
    
    const sectionLines = lines.slice(section.start + 1, section.end + 1);
    return sectionLines.join('\n').trim();
  }
}

module.exports = new ResumeParserService();