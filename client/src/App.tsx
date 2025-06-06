
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  Raffle, 
  User, 
  CreateRaffleInput, 
  CreateUserInput, 
  Participation,
  UserRole,
  WinnerSelectionMethod,
  RaffleStatus 
} from '../../server/src/schema';

function App() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [participants, setParticipants] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateRaffleDialogOpen, setIsCreateRaffleDialogOpen] = useState(false);
  const [isParticipateDialogOpen, setIsParticipateDialogOpen] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState('');

  // Form states
  const [userFormData, setUserFormData] = useState<CreateUserInput>({
    email: '',
    name: '',
    role: 'client'
  });

  const [raffleFormData, setRaffleFormData] = useState<CreateRaffleInput>({
    creator_id: 0,
    title: '',
    description: null,
    images: null,
    is_paid: false,
    price: null,
    winner_selection_method: 'random',
    number_quantity: null,
    number_digits: null,
    use_lottery_integration: null,
    raffle_date: new Date(),
    raffle_time: null
  });

  // Load data
  const loadRaffles = useCallback(async () => {
    try {
      const result = await trpc.getRaffles.query();
      setRaffles(result);
    } catch (error) {
      console.error('Failed to load raffles:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadParticipants = useCallback(async (raffleId: number) => {
    try {
      const result = await trpc.getRaffleParticipants.query({ raffle_id: raffleId });
      setParticipants(result);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  }, []);

  useEffect(() => {
    loadRaffles();
    loadUsers();
  }, [loadRaffles, loadUsers]);

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await trpc.createUser.mutate(userFormData);
      setUsers((prev: User[]) => [...prev, newUser]);
      setUserFormData({ email: '', name: '', role: 'client' });
      setIsCreateUserDialogOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create raffle
  const handleCreateRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const raffleData = {
        ...raffleFormData,
        creator_id: currentUser.id,
        // Convert empty string to null for optional fields
        description: raffleFormData.description || null,
        raffle_time: raffleFormData.raffle_time || null
      };
      
      const newRaffle = await trpc.createRaffle.mutate(raffleData);
      setRaffles((prev: Raffle[]) => [...prev, newRaffle]);
      
      // Reset form
      setRaffleFormData({
        creator_id: 0,
        title: '',
        description: null,
        images: null,
        is_paid: false,
        price: null,
        winner_selection_method: 'random',
        number_quantity: null,
        number_digits: null,
        use_lottery_integration: null,
        raffle_date: new Date(),
        raffle_time: null
      });
      setIsCreateRaffleDialogOpen(false);
    } catch (error) {
      console.error('Failed to create raffle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Participate in raffle
  const handleParticipate = async () => {
    if (!currentUser || !selectedRaffle) return;
    
    setIsLoading(true);
    try {
      await trpc.participateInRaffle.mutate({
        raffle_id: selectedRaffle.id,
        user_id: currentUser.id,
        selected_number: selectedNumber || null
      });
      
      setIsParticipateDialogOpen(false);
      setSelectedNumber('');
      
      // Reload participants if viewing details
      if (selectedRaffle) {
        loadParticipants(selectedRaffle.id);
      }
    } catch (error) {
      console.error('Failed to participate in raffle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Select winner
  const handleSelectWinner = async (raffleId: number) => {
    setIsLoading(true);
    try {
      await trpc.selectWinner.mutate({ raffle_id: raffleId });
      loadRaffles(); // Refresh to show winner
    } catch (error) {
      console.error('Failed to select winner:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // View raffle details
  const viewRaffleDetails = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    loadParticipants(raffle.id);
  };

  const getStatusColor = (status: RaffleStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const isCreator = currentUser?.role === 'creator';
  const myRaffles = raffles.filter((raffle: Raffle) => raffle.creator_id === currentUser?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 mb-2">🎲 RaffleHub</h1>
            <p className="text-purple-600">Create and participate in exciting raffles!</p>
          </div>
          
          <div className="flex gap-4 items-center">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-purple-900">{currentUser.name}</p>
                  <Badge variant={currentUser.role === 'creator' ? 'default' : 'secondary'}>
                    {currentUser.role}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentUser(null)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Switch User
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select onValueChange={(userId) => {
                  const user = users.find((u: User) => u.id === parseInt(userId));
                  setCurrentUser(user || null);
                }}>
                  <SelectTrigger className="w-48 border-purple-300">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: User) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      ➕ New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={userFormData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUserFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                      <Input
                        placeholder="Name"
                        value={userFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUserFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                      <Select 
                        value={userFormData.role} 
                        onValueChange={(role: UserRole) =>
                          setUserFormData((prev: CreateUserInput) => ({ ...prev, role }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="creator">Creator</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Creating...' : 'Create User'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {!currentUser ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Welcome to RaffleHub!</h2>
            <p className="text-purple-600">Please select or create a user to get started</p>
          </div>
        ) : (
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="browse" className="data-[state=active]:bg-white">
                🎲 Browse Raffles
              </TabsTrigger>
              {isCreator && (
                <TabsTrigger value="my-raffles" className="data-[state=active]:bg-white">
                  📝 My Raffles
                </TabsTrigger>
              )}
              <TabsTrigger value="details" className="data-[state=active]:bg-white">
                🔍 Raffle Details
              </TabsTrigger>
            </TabsList>

            {/* Browse Raffles Tab */}
            <TabsContent value="browse" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {raffles.filter((raffle: Raffle) => raffle.status === 'active').map((raffle: Raffle) => (
                  <Card key={raffle.id} className="hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm border-purple-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-purple-900">{raffle.title}</CardTitle>
                        <Badge className={getStatusColor(raffle.status)}>
                          {raffle.status}
                        </Badge>
                      </div>
                      {raffle.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{raffle.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium">
                            {raffle.winner_selection_method === 'random' ? '🎲 Random' : '🔢 Number Selection'}
                          </span>
                        </div>
                        {raffle.is_paid && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-bold text-green-600">${raffle.price?.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span>{raffle.raffle_date.toLocaleDateString()}</span>
                        </div>
                        {raffle.winner_selection_method === 'selection_number' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Numbers:</span>
                              <span>{raffle.number_quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Digits:</span>
                              <span>{raffle.number_digits}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button 
                        onClick={() => viewRaffleDetails(raffle)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRaffle(raffle);
                          setIsParticipateDialogOpen(true);
                        }}
                        size="sm"
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={raffle.status !== 'active'}
                      >
                        🎯 Participate
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {raffles.filter((raffle: Raffle) => raffle.status === 'active').length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎪</div>
                  <p className="text-gray-600">No active raffles available at the moment.</p>
                </div>
              )}
            </TabsContent>

            {/* My Raffles Tab (Creator only) */}
            {isCreator && (
              <TabsContent value="my-raffles" className="mt-6">
                <div className="mb-6">
                  <Dialog open={isCreateRaffleDialogOpen} onOpenChange={setIsCreateRaffleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        ➕ Create New Raffle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Raffle</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateRaffle} className="space-y-4">
                        <Input
                          placeholder="Raffle Title"
                          value={raffleFormData.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRaffleFormData((prev: CreateRaffleInput) => ({ ...prev, title: e.target.value }))
                          }
                          required
                        />
                        
                        <Textarea
                          placeholder="Description (optional)"
                          value={raffleFormData.description || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setRaffleFormData((prev: CreateRaffleInput) => ({ 
                              ...prev, 
                              description: e.target.value || null 
                            }))
                          }
                        />

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-paid"
                            checked={raffleFormData.is_paid}
                            onCheckedChange={(checked: boolean) =>
                              setRaffleFormData((prev: CreateRaffleInput) => ({ ...prev, is_paid: checked }))
                            }
                          />
                          <Label htmlFor="is-paid">Paid Raffle</Label>
                        </div>

                        {raffleFormData.is_paid && (
                          <Input
                            type="number"
                            placeholder="Price"
                            step="0.01"
                            min="0"
                            value={raffleFormData.price || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRaffleFormData((prev: CreateRaffleInput) => ({ 
                                ...prev, 
                                price: parseFloat(e.target.value) || null 
                              }))
                            }
                          />
                        )}

                        <Select
                          value={raffleFormData.winner_selection_method}
                          onValueChange={(method: WinnerSelectionMethod) =>
                            setRaffleFormData((prev: CreateRaffleInput) => ({ 
                              ...prev, 
                              winner_selection_method: method 
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">🎲 Random Selection</SelectItem>
                            <SelectItem value="selection_number">🔢 Number Selection</SelectItem>
                          </SelectContent>
                        </Select>

                        {raffleFormData.winner_selection_method === 'selection_number' && (
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              type="number"
                              placeholder="Number Quantity"
                              min="1"
                              value={raffleFormData.number_quantity || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRaffleFormData((prev: CreateRaffleInput) => ({ 
                                  ...prev, 
                                  number_quantity: parseInt(e.target.value) || null 
                                }))
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Number of Digits"
                              min="1"
                              max="10"
                              value={raffleFormData.number_digits || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRaffleFormData((prev: CreateRaffleInput) => ({ 
                                  ...prev, 
                                  number_digits: parseInt(e.target.value) || null 
                                }))
                              }
                            />
                          </div>
                        )}

                        {raffleFormData.winner_selection_method === 'selection_number' && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="lottery-integration"
                              checked={raffleFormData.use_lottery_integration || false}
                              onCheckedChange={(checked: boolean) =>
                                setRaffleFormData((prev: CreateRaffleInput) => ({ 
                                  ...prev, 
                                  use_lottery_integration: checked 
                                }))
                              }
                            />
                            <Label htmlFor="lottery-integration">Use Lottery Integration</Label>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="date"
                            value={raffleFormData.raffle_date.toISOString().split('T')[0]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRaffleFormData((prev: CreateRaffleInput) => ({ 
                                ...prev, 
                                raffle_date: new Date(e.target.value) 
                              }))
                            }
                            required
                          />
                          <Input
                            type="time"
                            placeholder="Time (optional)"
                            value={raffleFormData.raffle_time || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setRaffleFormData((prev: CreateRaffleInput) => ({ 
                                ...prev, 
                                raffle_time: e.target.value || null 
                              }))
                            }
                          />
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? 'Creating...' : 'Create Raffle'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myRaffles.map((raffle: Raffle) => (
                    <Card key={raffle.id} className="bg-white/70 backdrop-blur-sm border-purple-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-purple-900">{raffle.title}</CardTitle>
                          <Badge className={getStatusColor(raffle.status)}>
                            {raffle.status}
                          </Badge>
                        </div>
                        {raffle.description && (
                          <p className="text-sm text-gray-600">{raffle.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Link:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {raffle.unique_link}
                            </code>
                          </div>
                          {raffle.winner_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Winner:</span>
                              <span className="font-bold text-green-600">
                                User #{raffle.winner_id}
                                {raffle.winner_number && ` (${raffle.winner_number})`}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button 
                          onClick={() => viewRaffleDetails(raffle)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          View Details
                        </Button>
                        {raffle.status === 'active' && !raffle.winner_id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="flex-1">
                                🏆 Select Winner
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Select Winner</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to select the winner for "{raffle.title}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleSelectWinner(raffle.id)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? 'Selecting...' : 'Select Winner'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                {myRaffles.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-600">You haven't created any raffles yet.</p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Raffle Details Tab */}
            <TabsContent value="details" className="mt-6">
              {selectedRaffle ? (
                <div className="space-y-6">
                  <Card className="bg-white/70 backdrop-blur-sm border-purple-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl text-purple-900 mb-2">
                            {selectedRaffle.title}
                          </CardTitle>
                          <Badge className={getStatusColor(selectedRaffle.status)}>
                            {selectedRaffle.status}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>Created: {selectedRaffle.created_at.toLocaleDateString()}</p>
                          <p>Raffle Date: {selectedRaffle.raffle_date.toLocaleDateString()}</p>
                          {selectedRaffle.raffle_time && <p>Time: {selectedRaffle.raffle_time}</p>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedRaffle.description && (
                        <div>
                          <h3 className="font-semibold text-purple-900 mb-2">Description</h3>
                          <p className="text-gray-700">{selectedRaffle.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-purple-900 mb-2">Raffle Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Selection Method:</span>
                              <span className="font-medium">
                                {selectedRaffle.winner_selection_method === 'random' 
                                  ? '🎲 Random' 
                                  : '🔢 Number Selection'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Entry Fee:</span>
                              <span className="font-medium">
                                {selectedRaffle.is_paid 
                                  ? `$${selectedRaffle.price?.toFixed(2)}` 
                                  : '🆓 Free'
                                }
                              </span>
                            </div>
                            {selectedRaffle.winner_selection_method === 'selection_number' && (
                              <>
                                <div className="flex justify-between">
                                  <span>Available Numbers:</span>
                                  <span>{selectedRaffle.number_quantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Number Digits:</span>
                                  <span>{selectedRaffle.number_digits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Lottery Integration:</span>
                                  <span>{selectedRaffle.use_lottery_integration ? '✅ Yes' : '❌ No'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {selectedRaffle.winner_id && (
                          <div>
                            <h3 className="font-semibold text-purple-900 mb-2">🏆 Winner</h3>
                            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                              <p className="font-bold text-green-800">
                                User #{selectedRaffle.winner_id}
                              </p>
                              {selectedRaffle.winner_number && (
                                <p className="text-green-700">
                                  Winning Number: {selectedRaffle.winner_number}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-2">
                          👥 Participants ({participants.length})
                        </h3>
                        {participants.length > 0 ? (
                          <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                            <div className="space-y-2">
                              {participants.map((participant: Participation) => (
                                <div key={participant.id} className="flex justify-between text-sm">
                                  <span>User #{participant.user_id}</span>
                                  <div className="flex gap-2">
                                    {participant.selected_number && (
                                      <Badge variant="outline">#{participant.selected_number}</Badge>
                                    )}
                                    <span className="text-gray-500">
                                      {participant.created_at.toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No participants yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-gray-600">Select a raffle to view its details</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Participate Dialog */}
        <Dialog open={isParticipateDialogOpen} onOpenChange={setIsParticipateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Participate in Raffle</DialogTitle>
            </DialogHeader>
            {selectedRaffle && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900">{selectedRaffle.title}</h3>
                  {selectedRaffle.is_paid && (
                    <p className="text-green-600 font-bold">
                      Entry Fee: ${selectedRaffle.price?.toFixed(2)}
                    </p>
                  )}
                  {selectedRaffle.winner_selection_method === 'selection_number' && (
                    <p className="text-sm text-gray-600 mt-2">
                      Select a number between 1 and {selectedRaffle.number_quantity}
                    </p>
                  )}
                </div>
                
                {selectedRaffle.winner_selection_method === 'selection_number' && (
                  <Input
                    type="number"
                    placeholder="Select your number"
                    min="1"
                    max={selectedRaffle.number_quantity || undefined}
                    value={selectedNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSelectedNumber(e.target.value)
                    }
                  />
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsParticipateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleParticipate}
                    disabled={isLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? 'Participating...' : '🎯 Participate'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
