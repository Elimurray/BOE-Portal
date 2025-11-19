-- Unified BOE Portal Database Schema
-- Merges legacy system (Staff, Paper, Occurrence) with new system (papers, grades, etc.)

-- ============================================================================
-- STAFF TABLE (from legacy system)
-- ============================================================================
CREATE TABLE Staff (
  staff_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,  -- Added for matching with scraped data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert existing staff data
INSERT INTO Staff (staff_id, name) VALUES
(1, 'Alvin Yeo'),
(2, 'Bernhard Pfahringer'),
(3, 'Colin Pilbrow'),
(4, 'Daniel Delbourgo'),
(5, 'David Bainbridge'),
(6, 'David Nichols'),
(7, 'Eibe Frank'),
(8, 'Jemma Konig'),
(9, 'Judy Bowen'),
(10, 'Junaid Haseeb'),
(11, 'Nicholas Vanderschantz'),
(12, 'Nick Lim'),
(13, 'Pierre Lubis'),
(14, 'Raziyeh Zarredooghabadi'),
(15, 'Sapna Jaidka'),
(16, 'Shaoqun Wu'),
(17, 'Stephen Joe'),
(18, 'Steve Reeves'),
(19, 'Te Taka Keegan'),
(20, 'Tim Stokes'),
(21, 'Tony C Smith'),
(22, 'Vimal Kumar'),
(23, 'Yifan Chen'),
(24, 'Sally Jo Cunningham'),
(25, 'Farzana Zahid'),
(26, 'Marinho Barcellos'),
(27, 'Frank Wu'),
(28, 'Annika Hinze'),
(29, 'Han Gan'),
(30, 'Sean Oughton'),
(31, 'Tim Elphick'),
(32, 'Nilesh Kanji'),
(33, 'Cameron Grout'),
(34, 'Zane Hamilton'),
(35, 'Jessica Turner'),
(37, 'Phil Treweek');

SELECT setval('staff_staff_id_seq', 38);


-- ============================================================================
-- PAPERS TABLE (paper definitions only - no occurrence data)
-- ============================================================================
CREATE TABLE papers (
    paper_id SERIAL PRIMARY KEY,
    paper_code VARCHAR(20) NOT NULL UNIQUE,  -- e.g., COMPX310
    paper_name VARCHAR(255) NOT NULL,        -- e.g., Machine Learning
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert legacy paper data
INSERT INTO papers (paper_id, paper_code, paper_name) VALUES
(1, 'COMPX101', 'Introduction to Programming'),
(2, 'COMPX102', 'Object Oriented Programming'),
(3, 'COMPX151', 'Exploring Innovative Technologies'),
(4, 'COMPX161', 'Introduction to the Web'),
(5, 'COMPX171', 'Introduction to Digital Professional Skills'),
(6, 'COMPX201', 'Data Structures and Algorithms'),
(7, 'COMPX202', 'Mobile Computing and Software Architecture'),
(8, 'COMPX203', 'Computer Systems'),
(9, 'COMPX204', 'Practical networking and Cyber Security'),
(10, 'COMPX221', 'Programming for Creative Industries'),
(11, 'COMPX222', 'Web Development'),
(12, 'COMPX225', 'Introductino to Databases and Web Development'),
(13, 'COMPX230', 'Computer Hardware and Microporcessors'),
(14, 'COMPX234', 'Systems and Networks'),
(15, 'COMPX235', 'Cybersecurity Engineering'),
(16, 'COMPX241', 'Software Engineering Design 1'),
(17, 'COMPX242', 'Software Engineering Design 2'),
(18, 'COMPX251', 'Applied Computing Tools 1'),
(19, 'COMPX252', 'Applied Computing Tools 2'),
(20, 'COMPX271', 'Introduction to Software Development Methodologies'),
(21, 'COMPX278', 'Technology and Complex Problems'),
(22, 'COMPX290', 'Directed Study'),
(23, 'COMPX301', 'Design an Analysis of Algorithms'),
(24, 'COMPX304', 'Advanced Networking and Cyber Security'),
(25, 'COMPX307', 'Principles of Programming Languages'),
(26, 'COMPX310', 'Machine Learning'),
(27, 'COMPX318', 'Mobile Computing and the Internet of Things'),
(28, 'COMPX322', 'Advanced Web Development'),
(29, 'COMPX323', 'Advaanced Database Concepts'),
(30, 'COMPX324', 'User Experience Design'),
(31, 'COMPX326', 'Computer Vision'),
(32, 'COMPX328', 'Natural Language Processing'),
(33, 'COMPX341', 'Software Engineering Methods'),
(34, 'COMPX344', 'Applied Computational Methods'),
(35, 'COMPX349', 'Embedded Systems'),
(36, 'COMPX361', 'Logic and Computation'),
(37, 'COMPX367', 'Computational Mathematics'),
(38, 'COMPX371', 'Computer Science Work Placement'),
(39, 'COMPX374', 'Software Engineering Industry Projects'),
(40, 'COMPX390', 'Directed Study'),
(41, 'COMPX397', 'Work Integrated Learning Directed Study'),
(42, 'COMPX398', 'Work Integrated Learning Directed Study'),
(43, 'COMPX508', 'Malware Analysis'),
(44, 'COMPX511', 'Cyber Security Operations'),
(45, 'COMPX515', 'Security for Advancd Networks'),
(46, 'COMPX517', 'Vulnerability Analysis and Exploitation'),
(47, 'COMPX518', 'Cyber Security   '),
(48, 'COMPX519', 'Malware Analysis and Penetration Testing'),
(49, 'COMPX520', 'Dissertation'),
(50, 'COMPX521', 'Interpretable Machine Learning'),
(51, 'COMPX523', 'Machine Learning for Data Streams'),
(52, 'COMPX525', 'Deep  Learning'),
(53, 'COMPX526', 'Engineering Interative Medical Systems'),
(54, 'COMPX527', 'Secure Cloud Application Engineering'),
(55, 'COMPX532', 'Information Visualisation'),
(56, 'COMPX533', 'Extremely Parallel Programming'),
(57, 'COMPX539', 'Usability Engineering'),
(58, 'COMPX546', 'Graph Theory'),
(59, 'COMPX554', 'Specification Languages and Models'),
(60, 'COMPX555', 'Bioinformatics'),
(61, 'COMPX560', 'Turing Topics in Computer Science'),
(62, 'COMPX569', 'Programming wih Web Technologies'),
(63, 'COMPX567', 'Advanced Computational Mathematics'),
(64, 'COMPX568', 'Programming for Industry'),
(65, 'COMPX574', 'Open Source Software Project'),
(66, 'COMPX575', 'Programming Tools and Techniques'),
(67, 'COMPX576', 'Programming Project'),
(68, 'COMPX577', 'Report of an Invesigation'),
(69, 'COMPX581', 'Research Methods'),
(70, 'COMPX585', 'Preparation for Research in Computer Science'),
(71, 'CSMAX170', 'Foundations in Computing and Mathematical Sciences'),
(72, 'CSMAX175', 'Introduction to Cyber Security'),
(73, 'CSMAX270', 'Cultural Perspectives for Computing and Mathematical Sciences'),
(74, 'CSMAX300', 'Visual Data Communication'),
(75, 'CSMAX570', 'Preparing for the Internship'),
(76, 'CSMAX596', 'Computer Science Internship'),
(77, 'DATAX111', 'Statsitics for Science'),
(78, 'DATAX121', 'Introduction to Statistical Methods'),
(79, 'ENGEN102', 'Engingeering Computing 1'),
(80, 'ENGEN103', 'Engineering Computing 2'),
(81, 'MATHS135', 'Discrete Sructures'),
(82, 'MATHS165', 'General Mathematics'),
(83, 'MATHS168', 'Preparatory Maths');

SELECT setval('papers_paper_id_seq', 84);


-- ============================================================================
-- OCCURRENCES TABLE (specific offerings of papers)
-- ============================================================================
CREATE TABLE occurrences (
    occurrence_id SERIAL PRIMARY KEY,
    paper_id INT NOT NULL REFERENCES papers(paper_id) ON DELETE CASCADE,
    
    -- When and where
    year INT NOT NULL,
    trimester VARCHAR(20) NOT NULL,  -- A, B, C, Summer
    location VARCHAR(100) NOT NULL,  -- Hamilton, Tauranga, Online
    
    -- Offering details
    points INT,  -- Credit points (usually 15 or 30)
    delivery_mode VARCHAR(50),  -- OnCampus, Online, Blended
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(paper_id, year, trimester, location)
);

CREATE INDEX idx_occurrences_paper_id ON occurrences(paper_id);
CREATE INDEX idx_occurrences_year_trimester ON occurrences(year, trimester);

-- Insert legacy occurrence data
INSERT INTO occurrences (occurrence_id, paper_id, year, trimester, location) VALUES
(1, 50, 2023, 'B', 'Hamilton'),
(2, 37, 2023, 'B', 'Hamilton'),
(6, 1, 2023, 'B', 'Hamilton'),
(18, 18, 2023, 'B', 'Hamilton'),
(19, 19, 2023, 'B', 'Hamilton'),
(26, 26, 2023, 'B', 'Hamilton'),
(27, 16, 2023, 'A', 'Hamilton'),
(28, 6, 2023, 'A', 'Hamilton'),
(29, 7, 2023, 'B', 'Hamilton'),
(30, 17, 2023, 'B', 'Hamilton'),
(33, 66, 2023, 'B', 'Hamilton'),
(34, 36, 2023, 'B', 'Hamilton');

SELECT setval('occurrences_occurrence_id_seq', 37);



-- PAPER OUTLINES (scraped metadata from university system)
-- Stores data for each occurrence, not just the paper
CREATE TABLE paper_outlines (
    outline_id SERIAL PRIMARY KEY,
    occurrence_id INT REFERENCES occurrences(occurrence_id) ON DELETE CASCADE,
    
    -- Scraped data stored as JSONB for flexibility
    scraped_data JSONB,
    
    -- Metadata
    scraped_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR(500),
    scrape_success BOOLEAN DEFAULT TRUE,
    
    UNIQUE(occurrence_id)
);


-- OCCURRENCE_STAFF (links occurrences to staff members)
-- Role is contextual - same person can be Lecturer for one paper, Tutor for another
CREATE TABLE occurrence_staff (
    occurrence_id INT NOT NULL REFERENCES occurrences(occurrence_id) ON DELETE CASCADE,
    staff_id INT NOT NULL REFERENCES Staff(staff_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Lecturer', 'Convenor', 'Tutor', 'Administrator', 'Other')),
    PRIMARY KEY (occurrence_id, staff_id, role)
);

CREATE INDEX idx_occurrence_staff_staff_id ON occurrence_staff(staff_id);
CREATE INDEX idx_occurrence_staff_occurrence_id ON occurrence_staff(occurrence_id);

-- Insert legacy occurrence_staff data
-- Staff for those occurrences now reference the original occurrence_ids
INSERT INTO occurrence_staff (occurrence_id, staff_id, role) VALUES
(27, 3, 'Lecturer'),
(28, 3, 'Lecturer'),
(6, 7, 'Lecturer'),
(29, 8, 'Lecturer'),  
(29, 9, 'Lecturer'),  
(33, 15, 'Lecturer'),
(34, 20, 'Lecturer'),  
(18, 37, 'Tutor'),
(19, 37, 'Tutor');



-- GRADE DISTRIBUTIONS (optimized storage - one row per occurrence)
CREATE TABLE grade_distributions (
    distribution_id SERIAL PRIMARY KEY,
    occurrence_id INT REFERENCES occurrences(occurrence_id) ON DELETE CASCADE,
    
    -- Grade counts by letter grade
    grade_a_plus INT DEFAULT 0,
    grade_a INT DEFAULT 0,
    grade_a_minus INT DEFAULT 0,
    grade_b_plus INT DEFAULT 0,
    grade_b INT DEFAULT 0,
    grade_b_minus INT DEFAULT 0,
    grade_c_plus INT DEFAULT 0,
    grade_c INT DEFAULT 0,
    grade_c_minus INT DEFAULT 0,
    grade_d INT DEFAULT 0,
    grade_e INT DEFAULT 0,
    grade_rp INT DEFAULT 0,  
    grade_other INT DEFAULT 0, 
    
    -- Calculated statistics (auto-computed by PostgreSQL)
    total_students INT GENERATED ALWAYS AS (
        grade_a_plus + grade_a + grade_a_minus + 
        grade_b_plus + grade_b + grade_b_minus + 
        grade_c_plus + grade_c + grade_c_minus + 
        grade_d + grade_e + grade_rp + grade_other
    ) STORED,
    
    pass_count INT GENERATED ALWAYS AS (
        grade_a_plus + grade_a + grade_a_minus + 
        grade_b_plus + grade_b + grade_b_minus + 
        grade_c_plus + grade_c + grade_c_minus + grade_rp
    ) STORED,
    
    pass_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN (grade_a_plus + grade_a + grade_a_minus + 
                  grade_b_plus + grade_b + grade_b_minus + 
                  grade_c_plus + grade_c + grade_c_minus + 
                  grade_d + grade_e + grade_rp + grade_other) > 0 
            THEN ROUND(
                (grade_a_plus + grade_a + grade_a_minus + 
                 grade_b_plus + grade_b + grade_b_minus + 
                 grade_c_plus + grade_c + grade_c_minus + grade_rp)::DECIMAL 
                / 
                (grade_a_plus + grade_a + grade_a_minus + 
                 grade_b_plus + grade_b + grade_b_minus + 
                 grade_c_plus + grade_c + grade_c_minus + 
                 grade_d + grade_e + grade_rp + grade_other)::DECIMAL 
                * 100, 2
            )
            ELSE NULL 
        END
    ) STORED,
    
    -- Source information
    uploaded_from_csv BOOLEAN DEFAULT FALSE,
    upload_filename VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(occurrence_id)
);

CREATE INDEX idx_grade_distributions_occurrence_id ON grade_distributions(occurrence_id);



-- COURSE FORMS (BOE review forms)
CREATE TABLE course_forms (
    form_id SERIAL PRIMARY KEY,
    occurrence_id INT REFERENCES occurrences(occurrence_id) ON DELETE CASCADE,
    
    -- Submission info
    submitted_by_email VARCHAR(255),
    submitted_by_name VARCHAR(255),
    submission_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
    
    -- Staff info (can be pre-populated from occurrence_staff or paper_outlines)
    lecturers TEXT,
    tutors TEXT,
    
    -- Assessment details
    assessment_item_count INT,
    internal_external_split VARCHAR(50),
    assessment_types_summary TEXT,
    
    -- Delivery
    delivery_mode VARCHAR(50),
    
    -- Comments and changes
    major_changes_description TEXT,
    grade_distribution_different BOOLEAN,
    grade_distribution_comments TEXT,
    other_comments TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_course_forms_occurrence_id ON course_forms(occurrence_id);
CREATE INDEX idx_course_forms_status ON course_forms(status);



-- ADDITIONAL INDEXES FOR PERFORMANCE
CREATE INDEX idx_papers_code ON papers(paper_code);
CREATE INDEX idx_paper_outlines_occurrence_id ON paper_outlines(occurrence_id);



-- HELPER VIEW: Occurrence Summary
-- Combines all data for easy querying
CREATE VIEW occurrence_summary AS
SELECT 
    o.occurrence_id,
    p.paper_id,
    p.paper_code,
    p.paper_name,
    o.year,
    o.trimester,
    o.location,
    o.points,
    o.delivery_mode,
    gd.total_students,
    gd.pass_rate,
    gd.grade_a_plus,
    gd.grade_a,
    gd.grade_a_minus,
    gd.grade_b_plus,
    gd.grade_b,
    gd.grade_b_minus,
    gd.grade_c_plus,
    gd.grade_c,
    gd.grade_c_minus,
    gd.grade_d,
    gd.grade_e,
    gd.grade_rp,
    cf.status as form_status,
    po.scraped_data as outline_data
FROM occurrences o
JOIN papers p ON o.paper_id = p.paper_id
LEFT JOIN grade_distributions gd ON o.occurrence_id = gd.occurrence_id
LEFT JOIN course_forms cf ON o.occurrence_id = cf.occurrence_id
LEFT JOIN paper_outlines po ON o.occurrence_id = po.occurrence_id;