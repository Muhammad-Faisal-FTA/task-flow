// app/api/debug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { UserModel } from "@/models/user.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get user count and sample users
    const userCount = await UserModel.countDocuments();
    const sampleUsers = await UserModel.find({}, { email: 1, isVerified: 1, createdAt: 1 }).limit(3);
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        userCount,
        sampleUsers: sampleUsers.map(user => ({
          id: user._id.toString(),
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }))
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Email and password are required"
      }, { status: 400 });
    }
    
    // Find user with password field
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+password");
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }
    
    // Test password comparison
    const isMatch = await user.comparePassword(password);
    
    return NextResponse.json({
      success: true,
      message: "Password test completed",
      data: {
        userFound: true,
        email: user.email,
        isVerified: user.isVerified,
        passwordMatch: isMatch
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Debug test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}