Vagrant.configure("2") do |config|
	
	config.vm.box = "ubuntu/trusty64"
	
	config.vm.provider "virtualbox" do |v|
    	v.name = "IoT Development Environment"
    	v.customize ["modifyvm", :id, "--memory", "2048"]
	end

	config.vm.provision "shell" do |s|
    	s.path = "provision/setup.sh"
	end
end
