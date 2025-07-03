import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Target, BookOpen, CheckCircle, AlertCircle, Star, Download, Clock } from "lucide-react";

export default function CareerResources() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Career Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides and resources to advance your humanitarian career. From crafting the perfect CV to mastering interviews, we've got you covered.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <a href="#cv-writing" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-[#0077B5] mx-auto mb-2" />
                <h3 className="font-semibold group-hover:text-[#0077B5] transition-colors">CV Writing</h3>
              </CardContent>
            </Card>
          </a>
          <a href="#interview-prep" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-[#0077B5] mx-auto mb-2" />
                <h3 className="font-semibold group-hover:text-[#0077B5] transition-colors">Interview Prep</h3>
              </CardContent>
            </Card>
          </a>
          <a href="#cover-letters" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-[#0077B5] mx-auto mb-2" />
                <h3 className="font-semibold group-hover:text-[#0077B5] transition-colors">Cover Letters</h3>
              </CardContent>
            </Card>
          </a>
          <a href="#career-development" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-[#0077B5] mx-auto mb-2" />
                <h3 className="font-semibold group-hover:text-[#0077B5] transition-colors">Career Growth</h3>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* CV Writing Section */}
        <section id="cv-writing" className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <FileText className="h-7 w-7 text-[#0077B5]" />
                CV Writing Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 mb-6">
                  A compelling CV is your first opportunity to make an impression. In the humanitarian sector, 
                  your CV should demonstrate both technical skills and genuine commitment to humanitarian values.
                </p>

                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-[#0077B5] mb-3 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Essential CV Sections for Humanitarian Roles
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Required Sections:</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Professional Summary
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Field Experience
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Technical Skills
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Languages
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Security Training
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Additions:</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Volunteer Experience
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Research & Publications
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Professional Memberships
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Awards & Recognition
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Deployment History
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Do's
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Quantify your impact (e.g., "Reached 15,000 beneficiaries")</li>
                        <li>• Use action verbs (implemented, coordinated, developed)</li>
                        <li>• Highlight cross-cultural experience</li>
                        <li>• Include security clearances and medical fitness</li>
                        <li>• Tailor each CV to the specific role</li>
                        <li>• Include relevant certifications (UNHCR, SPHERE, etc.)</li>
                        <li>• Keep to 2-3 pages maximum</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Don'ts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Include personal photos (unless specifically requested)</li>
                        <li>• Use generic templates without customization</li>
                        <li>• List outdated or irrelevant skills</li>
                        <li>• Include personal details (age, marital status)</li>
                        <li>• Use overly complex formatting</li>
                        <li>• Forget to proofread for errors</li>
                        <li>• Include salary expectations</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Interview Preparation Section */}
        <section id="interview-prep" className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-7 w-7 text-[#0077B5]" />
                Interview Preparation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700">
                Humanitarian sector interviews often focus on both technical competencies and your ability to work 
                in challenging environments. Preparation is key to demonstrating your readiness.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-800">Before the Interview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Research the organization's mission and recent projects</li>
                      <li>• Study the country/region context</li>
                      <li>• Prepare STAR method examples</li>
                      <li>• Review current humanitarian trends</li>
                      <li>• Practice technical presentations</li>
                      <li>• Prepare thoughtful questions</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800">During the Interview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Demonstrate cultural sensitivity</li>
                      <li>• Show adaptability and resilience</li>
                      <li>• Provide concrete examples</li>
                      <li>• Ask about support systems</li>
                      <li>• Discuss security awareness</li>
                      <li>• Show genuine passion for the cause</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">After the Interview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Send a thoughtful thank-you email</li>
                      <li>• Provide additional documents if requested</li>
                      <li>• Follow up appropriately</li>
                      <li>• Reflect on areas for improvement</li>
                      <li>• Maintain professional connections</li>
                      <li>• Continue networking in the sector</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">Common Humanitarian Interview Questions</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Behavioral Questions:</h4>
                    <ul className="space-y-1">
                      <li>• Describe a time you worked under pressure</li>
                      <li>• How do you handle cultural differences?</li>
                      <li>• Tell us about a difficult team situation</li>
                      <li>• How do you maintain work-life balance in the field?</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Technical Questions:</h4>
                    <ul className="space-y-1">
                      <li>• How would you design a water system for 5,000 people?</li>
                      <li>• What are the key principles of humanitarian action?</li>
                      <li>• How do you ensure accountability to beneficiaries?</li>
                      <li>• Describe your approach to risk management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cover Letters Section */}
        <section id="cover-letters" className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Target className="h-7 w-7 text-[#0077B5]" />
                Cover Letter Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700">
                Your cover letter should complement your CV by telling a story about your motivation and 
                demonstrating your understanding of the humanitarian context.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Cover Letter Structure</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-[#0077B5] mt-1">1</Badge>
                    <div>
                      <h4 className="font-semibold">Opening Paragraph</h4>
                      <p className="text-sm text-gray-600">State the position and how you learned about it. Include a compelling hook that demonstrates your knowledge of the organization.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-[#0077B5] mt-1">2</Badge>
                    <div>
                      <h4 className="font-semibold">Body Paragraphs (2-3)</h4>
                      <p className="text-sm text-gray-600">Highlight relevant experience, demonstrate cultural competency, and show understanding of the challenges in the role/region.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-[#0077B5] mt-1">3</Badge>
                    <div>
                      <h4 className="font-semibold">Closing Paragraph</h4>
                      <p className="text-sm text-gray-600">Reiterate your interest, mention availability for deployment, and thank them for their consideration.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-700">Key Elements to Include</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Specific examples of field experience
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Understanding of local context
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Relevant technical skills
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Language capabilities
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Availability and flexibility
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-700">Common Mistakes to Avoid</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Generic, template-style writing
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Repeating information from your CV
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Focusing only on what you want
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Exceeding one page in length
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Poor grammar or formatting
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Career Development Section */}
        <section id="career-development" className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BookOpen className="h-7 w-7 text-[#0077B5]" />
                Career Development in Humanitarian Sector
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700">
                Building a successful humanitarian career requires continuous learning, strategic networking, 
                and intentional skill development across multiple competency areas.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-indigo-800">Essential Skills Development</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">Technical Skills</h4>
                        <p className="text-xs text-gray-600">Project management, data analysis, GIS, supply chain, financial management</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Soft Skills</h4>
                        <p className="text-xs text-gray-600">Cross-cultural communication, negotiation, leadership, stress management</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Languages</h4>
                        <p className="text-xs text-gray-600">French, Arabic, Spanish are highly valued in humanitarian contexts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-800">Professional Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>SPHERE Standards:</strong> Humanitarian charter and minimum standards</div>
                      <div>• <strong>UNHCR Training:</strong> Protection and refugee law courses</div>
                      <div>• <strong>IASC Guidelines:</strong> Mental health and psychosocial support</div>
                      <div>• <strong>PMBOK/PRINCE2:</strong> Project management certification</div>
                      <div>• <strong>HEAT/SSAFE:</strong> Security awareness training</div>
                      <div>• <strong>First Aid/Medical:</strong> Emergency medical response</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Career Progression Pathways</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-sm">Entry Level</h4>
                    <p className="text-xs text-gray-600">Junior Officer, Assistant positions, Internships</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-sm">Mid-Level</h4>
                    <p className="text-xs text-gray-600">Program Officer, Field Coordinator, Specialist roles</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-sm">Senior Level</h4>
                    <p className="text-xs text-gray-600">Country Director, Regional Manager, Technical Advisor</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Networking Strategies</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Join professional associations (ALNAP, InterAction, etc.)</li>
                    <li>• Attend humanitarian conferences and workshops</li>
                    <li>• Engage in online humanitarian communities</li>
                    <li>• Maintain relationships with former colleagues</li>
                    <li>• Participate in humanitarian coordination meetings</li>
                    <li>• Contribute to humanitarian publications and blogs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Continuous Learning</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Pursue relevant master's degrees (Development Studies, etc.)</li>
                    <li>• Take online courses (DisasterReady.org, Humanitarian Leadership Centre)</li>
                    <li>• Read humanitarian reports and research regularly</li>
                    <li>• Seek mentorship from senior professionals</li>
                    <li>• Volunteer for skill-based assignments</li>
                    <li>• Cross-train in different humanitarian sectors</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Additional Resources */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Download className="h-7 w-7 text-[#0077B5]" />
                Additional Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recommended Reading</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• "A Guide to the Global Humanitarian System" - InterAction</li>
                    <li>• "The State of the Humanitarian System" - ALNAP</li>
                    <li>• "Humanitarian Negotiations Revealed" - MSF</li>
                    <li>• "Core Humanitarian Competencies Guide" - IASC</li>
                    <li>• "Protection Mainstreaming Toolkit" - Global Protection Cluster</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Useful Websites</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• ReliefWeb - Latest humanitarian news and reports</li>
                    <li>• DisasterReady.org - Free online training courses</li>
                    <li>• Humanitarian Response - Coordination platform</li>
                    <li>• ALNAP - Learning and accountability resources</li>
                    <li>• Sphere Handbook - Humanitarian standards</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <div className="text-center bg-[#0077B5] text-white p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Advance Your Humanitarian Career?</h2>
          <p className="text-lg mb-6">
            Explore the latest job opportunities in Kenya and Somalia that match your skills and experience.
          </p>
          <a href="/" className="inline-flex items-center gap-2 bg-white text-[#0077B5] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            <Target className="h-5 w-5" />
            Browse Current Opportunities
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}