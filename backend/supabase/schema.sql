-- Digital Attendance System - Supabase Postgres schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- Replaces the old Mongoose/MongoDB models (User, Class, Course, Attendance, CumulativeAttendance).

-- profiles: app-specific data for each Supabase Auth user (auth.users only holds email/password/identity)
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique,
    name text not null,
    role text not null check (role in ('student', 'teacher')),
    registration_number text unique,
    google_id text unique,
    picture text,
    created_at timestamptz not null default now()
);
create index if not exists idx_profiles_registration_number on public.profiles (registration_number);

-- courses
create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    course_code text not null,
    course_name text not null,
    teacher_id uuid not null references public.profiles (id),
    teacher_name text not null,
    session text not null,
    created_at timestamptz not null default now(),
    unique (course_code, teacher_id, session)
);
create index if not exists idx_courses_teacher on public.courses (teacher_id);

-- classes
create table if not exists public.classes (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    type text not null check (type in ('online', 'offline')),
    validation_code text not null,
    teacher_id uuid not null references public.profiles (id),
    teacher_name text not null,
    course_id uuid references public.courses (id) on delete set null,
    teacher_latitude double precision,
    teacher_longitude double precision,
    date timestamptz not null default now(),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    constraint offline_requires_location check (
        type <> 'offline' or (teacher_latitude is not null and teacher_longitude is not null)
    )
);
create index if not exists idx_classes_teacher on public.classes (teacher_id);
create index if not exists idx_classes_course on public.classes (course_id);
create index if not exists idx_classes_active on public.classes (is_active);

-- attendance
create table if not exists public.attendance (
    id uuid primary key default gen_random_uuid(),
    class_id uuid not null references public.classes (id) on delete cascade,
    student_id uuid not null references public.profiles (id),
    student_name text not null,
    registration_number text not null,
    student_latitude double precision,
    student_longitude double precision,
    validation_code_used text not null,
    distance double precision,
    image_url text,
    "timestamp" timestamptz not null default now(),
    unique (class_id, student_id)
);
create index if not exists idx_attendance_class on public.attendance (class_id);
create index if not exists idx_attendance_student on public.attendance (student_id);

-- cumulative_attendance
create table if not exists public.cumulative_attendance (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses (id) on delete cascade,
    student_id uuid not null references public.profiles (id),
    student_name text not null,
    registration_number text not null,
    attendance_count integer not null default 0 check (attendance_count >= 0),
    first_attendance_date timestamptz not null,
    last_attendance_date timestamptz not null,
    updated_at timestamptz not null default now(),
    unique (course_id, student_id)
);
create index if not exists idx_cumulative_course on public.cumulative_attendance (course_id);
create index if not exists idx_cumulative_student on public.cumulative_attendance (student_id);

-- Atomic counter increment (avoids a fetch-then-update race under concurrent submissions)
create or replace function public.increment_cumulative_attendance(p_course_id uuid, p_student_id uuid)
returns public.cumulative_attendance
language sql
as $$
    update public.cumulative_attendance
    set attendance_count = attendance_count + 1,
        last_attendance_date = now(),
        updated_at = now()
    where course_id = p_course_id and student_id = p_student_id
    returning *;
$$;

-- Storage bucket for attendance verification photos (replaces Cloudinary).
-- Public so getPublicUrl() works the same way Cloudinary's secure_url did;
-- uploads/deletes are only ever done by the backend using the service_role
-- key, which bypasses storage RLS regardless of bucket visibility.
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', true)
on conflict (id) do nothing;

-- The backend (api/index.js) talks to Postgres exclusively with the service_role key,
-- which bypasses Row Level Security. All authorization (ownership checks, role checks)
-- is enforced in the Express service layer, same as it was with Mongoose. RLS is enabled
-- here anyway as defense-in-depth in case the anon/public key is ever used directly
-- against these tables; no policies are defined, so PostgREST access with the anon key
-- is denied by default.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.cumulative_attendance enable row level security;
