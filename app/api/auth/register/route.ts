import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // TODO: check if user already exists
    // const existing = await getUserByEmail(email);
    // if (existing) return NextResponse.json({ message: 'User already exists' }, { status: 409 });

    // TODO: hash password and save user to DB
    // const hashed = await bcrypt.hash(password, 10);
    // await createUser({ name, email, password: hashed });

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}