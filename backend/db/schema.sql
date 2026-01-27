--
-- PostgreSQL database dump
--

\restrict eigudR4h3J63hUGvXqedNrqn13qgpVzKifIdPC1MrKUKQfCpENGL1S3IbXhWeKC

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

-- Started on 2026-01-27 02:39:42 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 24947)
-- Name: course_forms; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.course_forms (
    form_id integer NOT NULL,
    occurrence_id integer,
    submitted_by_email character varying(255),
    submitted_by_name character varying(255),
    submission_date timestamp without time zone DEFAULT now(),
    status character varying(20) DEFAULT 'draft'::character varying,
    lecturers text,
    tutors text,
    assessment_item_count integer,
    internal_external_split character varying(200),
    assessment_types_summary text,
    delivery_mode character varying(200),
    major_changes_description text,
    grade_distribution_different boolean,
    grade_distribution_comments text,
    other_comments text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    rp_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT course_forms_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'reviewed'::character varying, 'approved'::character varying])::text[])))
);


ALTER TABLE public.course_forms OWNER TO eli;

--
-- TOC entry 225 (class 1259 OID 24946)
-- Name: course_forms_form_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.course_forms_form_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.course_forms_form_id_seq OWNER TO eli;

--
-- TOC entry 3519 (class 0 OID 0)
-- Dependencies: 225
-- Name: course_forms_form_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.course_forms_form_id_seq OWNED BY public.course_forms.form_id;


--
-- TOC entry 224 (class 1259 OID 24914)
-- Name: grade_distributions; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.grade_distributions (
    distribution_id integer NOT NULL,
    occurrence_id integer,
    grade_a_plus integer DEFAULT 0,
    grade_a integer DEFAULT 0,
    grade_a_minus integer DEFAULT 0,
    grade_b_plus integer DEFAULT 0,
    grade_b integer DEFAULT 0,
    grade_b_minus integer DEFAULT 0,
    grade_c_plus integer DEFAULT 0,
    grade_c integer DEFAULT 0,
    grade_c_minus integer DEFAULT 0,
    grade_d integer DEFAULT 0,
    grade_e integer DEFAULT 0,
    grade_rp integer DEFAULT 0,
    grade_other integer DEFAULT 0,
    total_students integer GENERATED ALWAYS AS (((((((((((((grade_a_plus + grade_a) + grade_a_minus) + grade_b_plus) + grade_b) + grade_b_minus) + grade_c_plus) + grade_c) + grade_c_minus) + grade_d) + grade_e) + grade_rp) + grade_other)) STORED,
    pass_count integer GENERATED ALWAYS AS ((((((((((grade_a_plus + grade_a) + grade_a_minus) + grade_b_plus) + grade_b) + grade_b_minus) + grade_c_plus) + grade_c) + grade_c_minus) + grade_rp)) STORED,
    pass_rate numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN (((((((((((((grade_a_plus + grade_a) + grade_a_minus) + grade_b_plus) + grade_b) + grade_b_minus) + grade_c_plus) + grade_c) + grade_c_minus) + grade_d) + grade_e) + grade_rp) + grade_other) > 0) THEN round(((((((((((((grade_a_plus + grade_a) + grade_a_minus) + grade_b_plus) + grade_b) + grade_b_minus) + grade_c_plus) + grade_c) + grade_c_minus) + grade_rp))::numeric / (((((((((((((grade_a_plus + grade_a) + grade_a_minus) + grade_b_plus) + grade_b) + grade_b_minus) + grade_c_plus) + grade_c) + grade_c_minus) + grade_d) + grade_e) + grade_rp) + grade_other))::numeric) * (100)::numeric), 2)
    ELSE NULL::numeric
END) STORED,
    uploaded_from_csv boolean DEFAULT false,
    upload_filename character varying(255),
    uploaded_at timestamp without time zone DEFAULT now(),
    grade_wd integer,
    grade_ic integer
);


ALTER TABLE public.grade_distributions OWNER TO eli;

--
-- TOC entry 223 (class 1259 OID 24913)
-- Name: grade_distributions_distribution_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.grade_distributions_distribution_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.grade_distributions_distribution_id_seq OWNER TO eli;

--
-- TOC entry 3520 (class 0 OID 0)
-- Dependencies: 223
-- Name: grade_distributions_distribution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.grade_distributions_distribution_id_seq OWNED BY public.grade_distributions.distribution_id;


--
-- TOC entry 222 (class 1259 OID 24895)
-- Name: occurrence_staff; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.occurrence_staff (
    occurrence_id integer NOT NULL,
    staff_id integer NOT NULL,
    role character varying(20) NOT NULL,
    CONSTRAINT occurrence_staff_role_check CHECK (((role)::text = ANY ((ARRAY['Lecturer'::character varying, 'Convenor'::character varying, 'Tutor'::character varying, 'Administrator'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.occurrence_staff OWNER TO eli;

--
-- TOC entry 219 (class 1259 OID 24860)
-- Name: occurrences; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.occurrences (
    occurrence_id integer NOT NULL,
    paper_id integer NOT NULL,
    year integer NOT NULL,
    trimester character varying(20) NOT NULL,
    location character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.occurrences OWNER TO eli;

--
-- TOC entry 221 (class 1259 OID 24878)
-- Name: paper_outlines; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.paper_outlines (
    outline_id integer NOT NULL,
    occurrence_id integer,
    scraped_data jsonb,
    scraped_at timestamp without time zone DEFAULT now(),
    source_url character varying(500),
    scrape_success boolean DEFAULT true
);


ALTER TABLE public.paper_outlines OWNER TO eli;

--
-- TOC entry 217 (class 1259 OID 24849)
-- Name: papers; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.papers (
    paper_id integer NOT NULL,
    paper_code character varying(20) NOT NULL,
    paper_name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.papers OWNER TO eli;

--
-- TOC entry 227 (class 1259 OID 25025)
-- Name: occurrence_summary; Type: VIEW; Schema: public; Owner: eli
--

CREATE VIEW public.occurrence_summary AS
 SELECT o.occurrence_id,
    p.paper_id,
    p.paper_code,
    p.paper_name,
    o.year,
    o.trimester,
    o.location,
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
    cf.status AS form_status,
    cf.lecturers,
    cf.tutors,
    cf.rp_count,
    cf.assessment_item_count,
    cf.internal_external_split,
    cf.assessment_types_summary,
    cf.major_changes_description,
    cf.grade_distribution_different,
    cf.grade_distribution_comments,
    cf.other_comments,
    cf.submitted_by_name,
    cf.submitted_by_email,
    po.scraped_data AS outline_data
   FROM ((((public.occurrences o
     JOIN public.papers p ON ((o.paper_id = p.paper_id)))
     LEFT JOIN public.grade_distributions gd ON ((o.occurrence_id = gd.occurrence_id)))
     LEFT JOIN public.course_forms cf ON ((o.occurrence_id = cf.occurrence_id)))
     LEFT JOIN public.paper_outlines po ON ((o.occurrence_id = po.occurrence_id)));


ALTER TABLE public.occurrence_summary OWNER TO eli;

--
-- TOC entry 218 (class 1259 OID 24859)
-- Name: occurrences_occurrence_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.occurrences_occurrence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.occurrences_occurrence_id_seq OWNER TO eli;

--
-- TOC entry 3521 (class 0 OID 0)
-- Dependencies: 218
-- Name: occurrences_occurrence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.occurrences_occurrence_id_seq OWNED BY public.occurrences.occurrence_id;


--
-- TOC entry 220 (class 1259 OID 24877)
-- Name: paper_outlines_outline_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.paper_outlines_outline_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.paper_outlines_outline_id_seq OWNER TO eli;

--
-- TOC entry 3522 (class 0 OID 0)
-- Dependencies: 220
-- Name: paper_outlines_outline_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.paper_outlines_outline_id_seq OWNED BY public.paper_outlines.outline_id;


--
-- TOC entry 216 (class 1259 OID 24848)
-- Name: papers_paper_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.papers_paper_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.papers_paper_id_seq OWNER TO eli;

--
-- TOC entry 3523 (class 0 OID 0)
-- Dependencies: 216
-- Name: papers_paper_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.papers_paper_id_seq OWNED BY public.papers.paper_id;


--
-- TOC entry 215 (class 1259 OID 24838)
-- Name: staff; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.staff (
    staff_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff OWNER TO eli;

--
-- TOC entry 214 (class 1259 OID 24837)
-- Name: staff_staff_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.staff_staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.staff_staff_id_seq OWNER TO eli;

--
-- TOC entry 3524 (class 0 OID 0)
-- Dependencies: 214
-- Name: staff_staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.staff_staff_id_seq OWNED BY public.staff.staff_id;


--
-- TOC entry 3324 (class 2604 OID 24950)
-- Name: course_forms form_id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.course_forms ALTER COLUMN form_id SET DEFAULT nextval('public.course_forms_form_id_seq'::regclass);


--
-- TOC entry 3305 (class 2604 OID 24917)
-- Name: grade_distributions distribution_id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.grade_distributions ALTER COLUMN distribution_id SET DEFAULT nextval('public.grade_distributions_distribution_id_seq'::regclass);


--
-- TOC entry 3299 (class 2604 OID 24863)
-- Name: occurrences occurrence_id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrences ALTER COLUMN occurrence_id SET DEFAULT nextval('public.occurrences_occurrence_id_seq'::regclass);


--
-- TOC entry 3302 (class 2604 OID 24881)
-- Name: paper_outlines outline_id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.paper_outlines ALTER COLUMN outline_id SET DEFAULT nextval('public.paper_outlines_outline_id_seq'::regclass);


--
-- TOC entry 3296 (class 2604 OID 24852)
-- Name: papers paper_id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.papers ALTER COLUMN paper_id SET DEFAULT nextval('public.papers_paper_id_seq'::regclass);


--
-- TOC entry 3293 (class 2604 OID 24841)
-- Name: staff staff_id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.staff ALTER COLUMN staff_id SET DEFAULT nextval('public.staff_staff_id_seq'::regclass);


--
-- TOC entry 3362 (class 2606 OID 24959)
-- Name: course_forms course_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.course_forms
    ADD CONSTRAINT course_forms_pkey PRIMARY KEY (form_id);


--
-- TOC entry 3357 (class 2606 OID 24939)
-- Name: grade_distributions grade_distributions_occurrence_id_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.grade_distributions
    ADD CONSTRAINT grade_distributions_occurrence_id_key UNIQUE (occurrence_id);


--
-- TOC entry 3359 (class 2606 OID 24937)
-- Name: grade_distributions grade_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.grade_distributions
    ADD CONSTRAINT grade_distributions_pkey PRIMARY KEY (distribution_id);


--
-- TOC entry 3355 (class 2606 OID 24900)
-- Name: occurrence_staff occurrence_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrence_staff
    ADD CONSTRAINT occurrence_staff_pkey PRIMARY KEY (occurrence_id, staff_id, role);


--
-- TOC entry 3344 (class 2606 OID 24869)
-- Name: occurrences occurrences_paper_id_year_trimester_location_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_paper_id_year_trimester_location_key UNIQUE (paper_id, year, trimester, location);


--
-- TOC entry 3346 (class 2606 OID 24867)
-- Name: occurrences occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_pkey PRIMARY KEY (occurrence_id);


--
-- TOC entry 3349 (class 2606 OID 24889)
-- Name: paper_outlines paper_outlines_occurrence_id_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.paper_outlines
    ADD CONSTRAINT paper_outlines_occurrence_id_key UNIQUE (occurrence_id);


--
-- TOC entry 3351 (class 2606 OID 24887)
-- Name: paper_outlines paper_outlines_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.paper_outlines
    ADD CONSTRAINT paper_outlines_pkey PRIMARY KEY (outline_id);


--
-- TOC entry 3338 (class 2606 OID 24858)
-- Name: papers papers_paper_code_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.papers
    ADD CONSTRAINT papers_paper_code_key UNIQUE (paper_code);


--
-- TOC entry 3340 (class 2606 OID 24856)
-- Name: papers papers_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.papers
    ADD CONSTRAINT papers_pkey PRIMARY KEY (paper_id);


--
-- TOC entry 3333 (class 2606 OID 24847)
-- Name: staff staff_email_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_email_key UNIQUE (email);


--
-- TOC entry 3335 (class 2606 OID 24845)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (staff_id);


--
-- TOC entry 3363 (class 1259 OID 24965)
-- Name: idx_course_forms_occurrence_id; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_course_forms_occurrence_id ON public.course_forms USING btree (occurrence_id);


--
-- TOC entry 3364 (class 1259 OID 24966)
-- Name: idx_course_forms_status; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_course_forms_status ON public.course_forms USING btree (status);


--
-- TOC entry 3360 (class 1259 OID 24945)
-- Name: idx_grade_distributions_occurrence_id; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_grade_distributions_occurrence_id ON public.grade_distributions USING btree (occurrence_id);


--
-- TOC entry 3352 (class 1259 OID 24912)
-- Name: idx_occurrence_staff_occurrence_id; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_occurrence_staff_occurrence_id ON public.occurrence_staff USING btree (occurrence_id);


--
-- TOC entry 3353 (class 1259 OID 24911)
-- Name: idx_occurrence_staff_staff_id; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_occurrence_staff_staff_id ON public.occurrence_staff USING btree (staff_id);


--
-- TOC entry 3341 (class 1259 OID 24875)
-- Name: idx_occurrences_paper_id; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_occurrences_paper_id ON public.occurrences USING btree (paper_id);


--
-- TOC entry 3342 (class 1259 OID 24876)
-- Name: idx_occurrences_year_trimester; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_occurrences_year_trimester ON public.occurrences USING btree (year, trimester);


--
-- TOC entry 3347 (class 1259 OID 24968)
-- Name: idx_paper_outlines_occurrence_id; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_paper_outlines_occurrence_id ON public.paper_outlines USING btree (occurrence_id);


--
-- TOC entry 3336 (class 1259 OID 24967)
-- Name: idx_papers_code; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_papers_code ON public.papers USING btree (paper_code);


--
-- TOC entry 3370 (class 2606 OID 24960)
-- Name: course_forms course_forms_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.course_forms
    ADD CONSTRAINT course_forms_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(occurrence_id) ON DELETE CASCADE;


--
-- TOC entry 3369 (class 2606 OID 24940)
-- Name: grade_distributions grade_distributions_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.grade_distributions
    ADD CONSTRAINT grade_distributions_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(occurrence_id) ON DELETE CASCADE;


--
-- TOC entry 3367 (class 2606 OID 24901)
-- Name: occurrence_staff occurrence_staff_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrence_staff
    ADD CONSTRAINT occurrence_staff_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(occurrence_id) ON DELETE CASCADE;


--
-- TOC entry 3368 (class 2606 OID 24906)
-- Name: occurrence_staff occurrence_staff_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrence_staff
    ADD CONSTRAINT occurrence_staff_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id) ON DELETE CASCADE;


--
-- TOC entry 3365 (class 2606 OID 24870)
-- Name: occurrences occurrences_paper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_paper_id_fkey FOREIGN KEY (paper_id) REFERENCES public.papers(paper_id) ON DELETE CASCADE;


--
-- TOC entry 3366 (class 2606 OID 24890)
-- Name: paper_outlines paper_outlines_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.paper_outlines
    ADD CONSTRAINT paper_outlines_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(occurrence_id) ON DELETE CASCADE;


-- Completed on 2026-01-27 02:39:42 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict eigudR4h3J63hUGvXqedNrqn13qgpVzKifIdPC1MrKUKQfCpENGL1S3IbXhWeKC

