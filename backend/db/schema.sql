-- Papers table
CREATE TABLE papers (
    paper_id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(255),
    semester VARCHAR(10),
    year INT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(code, year, semester, location)
);

-- Paper outlines (scraped data)
CREATE TABLE paper_outlines (
    outline_id SERIAL PRIMARY KEY,
    paper_id INT REFERENCES papers(paper_id) ON DELETE CASCADE,
    scraped_data JSONB,
    scraped_at TIMESTAMP DEFAULT NOW(),
    source_url VARCHAR(500),
    scrape_success BOOLEAN DEFAULT TRUE,
    UNIQUE(paper_id)
);

-- Grades from CSV uploads
CREATE TABLE grades (
    grade_id SERIAL PRIMARY KEY,
    paper_id INT REFERENCES papers(paper_id) ON DELETE CASCADE,
    student_id VARCHAR(50),
    paper_total DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Course forms
CREATE TABLE course_forms (
    form_id SERIAL PRIMARY KEY,
    paper_id INT REFERENCES papers(paper_id) ON DELETE CASCADE,
    submitted_by_email VARCHAR(255),
    submitted_by_name VARCHAR(255),
    lecturers TEXT,
    tutors TEXT,
    student_count INT,
    pass_count INT,
    pass_rate DECIMAL(5,2),
    rp_count INT,
    assessment_item_count INT,
    internal_external_split VARCHAR(50),
    assessment_types_summary TEXT,
    delivery_mode VARCHAR(50),
    major_changes_description TEXT,
    grade_distribution_different BOOLEAN,
    grade_distribution_comments TEXT,
    other_comments TEXT,
    submission_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_papers_code ON papers(code);
CREATE INDEX idx_grades_paper_id ON grades(paper_id);
CREATE INDEX idx_forms_paper_id ON course_forms(paper_id);