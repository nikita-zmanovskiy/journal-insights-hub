import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      toast({
        title: 'Доступ запрещен',
        description: 'У вас нет прав администратора',
        variant: 'destructive',
      });
      navigate('/');
    } else {
      setIsAdmin(true);
      loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    const [categoriesRes, testsRes] = await Promise.all([
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('tests').select('*, categories(name)').order('created_at', { ascending: false }),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (testsRes.data) setTests(testsRes.data);
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить категорию',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Категория удалена' });
      loadData();
    }
  };

  const deleteTest = async (id: string) => {
    const { error } = await supabase.from('tests').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тест',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Тест удален' });
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Админ-панель
          </h1>
          <div className="w-24" />
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="tests">Тесты</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Управление категориями</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="glass-panel rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <p className="text-xs text-primary mt-1">Рейтинг: {category.rating}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Управление тестами</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="glass-panel rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold">{test.title}</h3>
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                        <p className="text-xs text-primary mt-1">Рейтинг: {test.rating}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteTest(test.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
