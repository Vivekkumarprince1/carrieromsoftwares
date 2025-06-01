const pdf = require('pdf-parse');
const textract = require('textract');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const pdf2pic = require('pdf2pic');
const path = require('path');

const REGEXES = {
  phone: /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/g,
  bulletPoints: /[•\-*]\s*([^•\-*\n]+)/g,
  // Indian phone number patterns
  indianPhone: /(?:\+91[\s\-]?)?(?:0?[6-9]\d{9}|\d{10})/g
};

const KEYWORDS = {
  skills: ['javascript', 'html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'mongodb', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'sql', 'mysql', 'postgresql', 'nosql', 'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'git', 'tensorflow', 'pytorch', 'machine learning', 'ai', 'data science', 'analytics', 'statistics', 'blockchain', 'ios', 'android', 'mobile', 'responsive', 'frontend', 'backend', 'fullstack', 'devops', 'security', 'testing', 'qa', 'api', 'rest', 'graphql', 'microservices', 'architecture', 'agile', 'scrum', 'leadership', 'management', 'communication', 'teamwork', 'project management', 'problem solving', 'analytical', 'creativity', 'time management', 'critical thinking', 'reactjs', 'nodejs', 'expressjs', 'tailwindcss', 'bootstrap', 'linux', 'shell scripting'],
  degrees: ['Bachelor', 'Master', 'PhD', 'B\\.?S\\.?', 'M\\.?S\\.?', 'B\\.?A\\.?', 'M\\.?A\\.?', 'B\\.?E\\.?', 'M\\.?E\\.?', 'B\\.?Tech', 'M\\.?Tech', 'MBA', 'Associate', 'Diploma', 'Certificate', 'Postgraduate', 'Doctorate', 'Undergraduate', 'CGPA', 'GPA'],
  positions: ['Engineer', 'Developer', 'Manager', 'Director', 'Coordinator', 'Specialist', 'Analyst', 'Designer', 'Consultant', 'Assistant', 'Lead', 'Head', 'Intern', 'SWE', 'Software Engineer', 'FullStack', 'Full Stack'],
  institutions: ['university', 'college', 'institute', 'school', 'academy', 'UNIVERSITY', 'COLLEGE', 'INSTITUTE']
};

const SECTION_HEADERS = {
  education: ['EDUCATION', 'ACADEMIC BACKGROUND', 'QUALIFICATIONS', 'EDUCATIONAL BACKGROUND', 'ACADEMIC QUALIFICATIONS'],
  experience: ['EXPERIENCE', 'WORK EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT HISTORY', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT', 'JOB EXPERIENCE', 'CAREER HISTORY'],
  skills: ['SKILLS', 'TECHNICAL SKILLS', 'EXPERTISE', 'CORE COMPETENCIES', 'COMPETENCIES', 'ABILITIES', 'TECHNICAL EXPERTISE'],
  projects: ['PROJECTS', 'PROJECT EXPERIENCE', 'PERSONAL PROJECTS', 'ACADEMIC PROJECTS'],
  achievements: ['ACHIEVEMENTS', 'ACCOMPLISHMENTS', 'AWARDS', 'HONORS'],
  cocurricular: ['COCURRICULAR', 'CO-CURRICULAR', 'EXTRACURRICULAR', 'ACTIVITIES']
};

exports.parseResume = async (filePath, fileType) => {
  try {
    let text = '';
    let isOcrUsed = false;

    if (fileType === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      text = pdfData.text;

      // Check if PDF is image-based (little to no extractable text)
      if (isPdfImageBased(text)) {
        console.log('PDF appears to be image-based, attempting OCR...');
        text = await extractTextFromImagePDF(filePath);
        isOcrUsed = true;
      }
    } else if (['docx', 'doc'].includes(fileType)) {
      text = await new Promise((resolve, reject) => {
        textract.fromFileWithPath(filePath, (error, text) => {
          if (error) reject(error);
          resolve(text);
        });
      });
    }

    const resumeFormat = detectResumeFormat(text);
    text = normalizeResumeText(text);
    console.log('Normalized text preview:', text.substring(0, 500));
    
    const sections = extractSections(text, resumeFormat);
    console.log('Extracted sections:', Object.keys(sections));

    const extractedData = {
      phone: extractPhone(text, sections),
      skills: extractSkills(text, sections),
      experience: extractExperience(text, sections),
      education: extractEducation(text, sections),
      metadata: {
        isOcrUsed,
        resumeFormat,
        textLength: text.length,
        sectionsFound: Object.keys(sections)
      }
    };

    console.log('Final extracted data:', {
      phone: extractedData.phone,
      skills: Array.isArray(extractedData.skills) ? extractedData.skills.slice(0, 5) : extractedData.skills?.substring(0, 100),
      experience: extractedData.experience?.substring(0, 200),
      education: extractedData.education?.substring(0, 200)
    });

    return normalizeDataForForms(extractedData);
  } catch (error) {
    console.error('Parse error:', error);
    throw error;
  }
};

const detectResumeFormat = (text) => {
  const formatScores = {
    chronological: countKeywordsInText(text, ['experience', 'work history', 'employment', 'job']),
    functional: countKeywordsInText(text, ['skills', 'competencies', 'expertise', 'qualifications']),
    academic: countKeywordsInText(text, ['publications', 'research', 'teaching', 'conferences', 'grants'])
  };

  return Object.entries(formatScores).reduce((a, b) => formatScores[a[0]] > formatScores[b[0]] ? a : b)[0];
};

const countKeywordsInText = (text, keywords) => {
  return keywords.reduce((count, keyword) => {
    const matches = text.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || [];
    return count + matches.length;
  }, 0);
};

const normalizeResumeText = (text) => text
  .replace(/\r\n/g, '\n')
  .replace(/\s+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

// FIXED: Improved section extraction with better pattern matching
const extractSections = (text, resumeFormat) => {
  const sections = {};
  
  // Split text into lines for easier processing
  const lines = text.split('\n');
  
  // Find all section headers and their positions
  const sectionPositions = [];
  
  Object.entries(SECTION_HEADERS).forEach(([sectionType, headers]) => {
    headers.forEach(header => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Match exact header or header followed by common separators
        if (line === header || line === `${header}:` || line === `${header} :`) {
          sectionPositions.push({
            type: sectionType,
            header: header,
            lineIndex: i,
            line: line
          });
        }
      }
    });
  });

  // Sort sections by their position in the document
  sectionPositions.sort((a, b) => a.lineIndex - b.lineIndex);
  
  console.log('Found section headers:', sectionPositions.map(s => `${s.header} at line ${s.lineIndex}`));

  // Extract content for each section
  for (let i = 0; i < sectionPositions.length; i++) {
    const currentSection = sectionPositions[i];
    const nextSection = sectionPositions[i + 1];
    
    const startLine = currentSection.lineIndex + 1;
    const endLine = nextSection ? nextSection.lineIndex : lines.length;
    
    const sectionContent = lines.slice(startLine, endLine)
      .join('\n')
      .trim();
    
    if (sectionContent) {
      sections[currentSection.type] = sectionContent;
      console.log(`Extracted ${currentSection.type} section: ${sectionContent.substring(0, 100)}...`);
    }
  }

  // Add header section (first few lines before any section header)
  const firstSectionLine = sectionPositions.length > 0 ? sectionPositions[0].lineIndex : 10;
  sections.header = lines.slice(0, Math.min(firstSectionLine, 10)).join('\n').trim();

  return sections;
};

const extractBulletPoints = (section) => {
  const matches = section.match(REGEXES.bulletPoints);
  return matches ? matches.map(entry => entry.replace(/[•\-*]\s*/, '').trim()) : null;
};

const extractWithKeywords = (text, keywords, maxMatches = 10) => {
  const pattern = keywords.join('|');
  const regex = new RegExp(`\\b(${pattern})\\b[^\\n.]*`, 'gi');
  const matches = [];
  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null && count < maxMatches) {
    const start = Math.max(0, text.lastIndexOf('\n', match.index));
    const end = text.indexOf('\n', match.index + match[0].length);
    const context = text.substring(start, end > -1 ? end : text.length).trim();
    matches.push(context);
    count++;
  }

  return matches.join('\n');
};

// FIXED: Improved phone extraction with Indian phone number support
const extractPhone = (text, sections) => {
  const contactText = sections.header || text;
  
  // Try Indian phone number pattern first
  const indianMatch = contactText.match(REGEXES.indianPhone);
  if (indianMatch) {
    return indianMatch[0];
  }
  
  // Fall back to US phone number pattern
  const usMatch = contactText.match(REGEXES.phone);
  return usMatch ? usMatch[0] : '';
};

// FIXED: Improved skills extraction
const extractSkills = (text, sections) => {
  const skillsSection = sections.skills;

  if (skillsSection) {
    console.log('Skills section found:', skillsSection.substring(0, 200));
    
    // Try to extract bullet points first
    const bulletPoints = extractBulletPoints(skillsSection);
    if (bulletPoints && bulletPoints.length > 0) {
      return bulletPoints;
    }

    // Try to extract from structured format (like the sample resume)
    const structuredSkills = extractStructuredSkills(skillsSection);
    if (structuredSkills.length > 0) {
      return structuredSkills;
    }

    // Try comma-separated skills
    const commaSkills = skillsSection.split(',').map(s => s.trim()).filter(Boolean);
    if (commaSkills.length > 2) {
      return commaSkills;
    }
  }

  // Fallback: search entire text for known skills
  const textToSearch = skillsSection || text;
  const skillRegex = new RegExp(`\\b(${KEYWORDS.skills.join('|')})\\b`, 'gi');
  const matches = textToSearch.match(skillRegex) || [];
  return [...new Set(matches.map(skill => skill.toLowerCase()))];
};

// NEW: Extract skills from structured format
const extractStructuredSkills = (skillsSection) => {
  const skills = [];
  const lines = skillsSection.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip category headers (like LANGUAGES, FRAMEWORKS)
    if (trimmedLine.match(/^[A-Z\s]+$/)) {
      continue;
    }
    
    // Extract skills separated by | or ,
    if (trimmedLine.includes('|')) {
      const lineSkills = trimmedLine.split('|')
        .map(s => s.trim())
        .filter(s => s && !s.match(/^[A-Z\s]+$/));
      skills.push(...lineSkills);
    } else if (trimmedLine.includes(',')) {
      const lineSkills = trimmedLine.split(',')
        .map(s => s.trim())
        .filter(s => s && !s.match(/^[A-Z\s]+$/));
      skills.push(...lineSkills);
    }
  }
  
  return skills.filter(skill => skill.length > 1);
};

// FIXED: Improved education extraction
const extractEducation = (text, sections) => {
  const educationSection = sections.education;

  if (!educationSection) {
    console.log('No education section found, searching in full text');
    return extractWithKeywords(text, KEYWORDS.degrees, 3);
  }

  console.log('Education section found:', educationSection.substring(0, 200));

  // Try bullet points first
  const bulletPoints = extractBulletPoints(educationSection);
  if (bulletPoints && bulletPoints.length > 0) {
    return bulletPoints.join('\n');
  }

  // For structured education (like the sample), return the entire section
  if (educationSection.includes('CGPA') || educationSection.includes('GPA') || 
      educationSection.match(/\b(19|20)\d{2}\b/)) {
    return educationSection;
  }

  // Try to extract degree information
  const degreeRegex = new RegExp(`(${KEYWORDS.degrees.join('|')})[^\\n.]*(${KEYWORDS.institutions.join('|')}|\\d{4})[^\\n.]*`, 'gi');
  const matches = [];
  let match;

  while ((match = degreeRegex.exec(educationSection)) !== null) {
    matches.push(match[0].trim());
  }

  if (matches.length > 0) {
    return matches.join('\n');
  }

  // If no specific matches, return the education section (if reasonable length)
  return educationSection.length < 1000 ? educationSection : educationSection.substring(0, 500);
};

// FIXED: Improved experience extraction
const extractExperience = (text, sections) => {
  const experienceSection = sections.experience;

  if (!experienceSection) {
    console.log('No experience section found, searching in full text');
    return extractWithKeywords(text, KEYWORDS.positions, 3);
  }

  console.log('Experience section found:', experienceSection.substring(0, 200));

  // For structured experience (like the sample), return the entire section
  if (experienceSection.includes('|') && 
      (experienceSection.includes('Intern') || experienceSection.includes('Developer') || 
       experienceSection.includes('Engineer'))) {
    return experienceSection;
  }

  // Try bullet points
  const bulletPointSections = experienceSection.split(/\n{2,}/).filter(section => section.match(/[•\-*]\s+/));
  if (bulletPointSections.length > 0) {
    return bulletPointSections.join('\n\n');
  }

  // Try to extract job entries
  const jobTitlePatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:at|,|\||-)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\)/g
  ];

  for (const pattern of jobTitlePatterns) {
    const matches = [];
    let match;
    while ((match = pattern.exec(experienceSection)) !== null) {
      const start = Math.max(0, experienceSection.lastIndexOf('\n\n', match.index));
      const end = experienceSection.indexOf('\n\n', match.index);
      const paragraph = experienceSection.substring(start, end > -1 ? end : experienceSection.length).trim();
      matches.push(paragraph);
    }
    if (matches.length > 0) {
      return matches.join('\n\n');
    }
  }

  // Return the experience section (with reasonable length limit)
  return experienceSection.length < 1500 ? experienceSection : experienceSection.substring(0, 1000);
};

const normalizeDataForForms = (data) => ({
  phone: data.phone || 'Not specified in resume',
  skills: Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || 'Not specified in resume',
  education: data.education || 'Not specified in resume',
  experience: data.experience || 'Not specified in resume',
  metadata: data.metadata || {}
});

// OCR function for image-based PDFs
const extractTextFromImagePDF = async (filePath) => {
  try {
    console.log('Starting OCR process for image-based PDF...');
    
    // Convert PDF pages to images and process with OCR
    console.log('Converting PDF to images...');
    
    const tempDir = path.join(path.dirname(filePath), 'temp_ocr_images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const convert = pdf2pic.fromPath(filePath, {
      density: 150,           // Lower DPI for better compatibility
      saveFilename: "page",
      savePath: tempDir,
      format: "png",
      width: 800,             // Smaller size for better processing
      height: 1000
    });

    let extractedText = '';
    const maxPages = 3; // Limit to first 3 pages for performance

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}...`);
        
        const result = await convert(pageNum, { responseType: "image" });
        
        if (result && result.path && fs.existsSync(result.path)) {
          console.log(`Running OCR on page ${pageNum}...`);
          
          const { data: { text } } = await Tesseract.recognize(result.path, 'eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`Page ${pageNum} OCR: ${Math.round(m.progress * 100)}%`);
              }
            }
          });
          
          if (text && text.trim().length > 0) {
            extractedText += `\n--- Page ${pageNum} ---\n${text}\n`;
          }
          
          // Clean up image file
          try {
            fs.unlinkSync(result.path);
          } catch (cleanupError) {
            console.warn(`Failed to clean up ${result.path}`);
          }
        }
        
      } catch (pageError) {
        console.warn(`Failed to process page ${pageNum}: ${pageError.message}`);
        continue;
      }
    }

    // Clean up temp directory
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          try {
            fs.unlinkSync(path.join(tempDir, file));
          } catch (e) {}
        });
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up temp directory');
    }

    if (extractedText && extractedText.trim().length > 0) {
      console.log(`✅ OCR successful! Extracted ${extractedText.length} characters`);
      return extractedText;
    }

    // If OCR couldn't extract anything meaningful
    throw new Error('OCR could not extract readable text from this PDF. The file may be corrupted, heavily formatted, or contain complex layouts.');

  } catch (error) {
    console.error('OCR extraction failed:', error.message);
    throw new Error(`Failed to extract text from image-based PDF: ${error.message}`);
  }
};

// Helper function to detect if PDF contains mostly images
const isPdfImageBased = (pdfText, threshold = 50) => {
  const cleanText = pdfText.replace(/\s+/g, ' ').trim();
  return cleanText.length < threshold;
};